#!/usr/bin/env npx tsx
/**
 * VANTA Fleet Audit
 * Scans all devices, maps accounts, identifies orphan sessions, generates report
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface DeviceInfo {
  device_id: string;
  account_count: number;
  logged_in_count: number;
  active_count: number;
}

interface AccountInfo {
  device_id: string;
  username: string;
  current_display_name: string;
  status: string;
  session_state: string;
  last_activity_at: string;
}

interface OrphanSession {
  device_id: string;
  account_username: string;
  session_state: string;
}

async function auditFleet() {
  try {
    console.log('\n=== VANTA FLEET AUDIT ===\n');
    
    // Get device stats
    const devices = await sql<DeviceInfo[]>`
      SELECT 
        a.device_id,
        COUNT(a.id) as account_count,
        SUM(CASE WHEN a.status = 'logged_in' THEN 1 ELSE 0 END) as logged_in_count,
        SUM(CASE WHEN a.status = 'active' THEN 1 ELSE 0 END) as active_count
      FROM accounts a
      WHERE a.device_id IS NOT NULL AND a.device_id != ''
      GROUP BY a.device_id
      ORDER BY a.device_id ASC
    `;

    // Get all account-device mappings
    const accounts = await sql<AccountInfo[]>`
      SELECT
        a.device_id,
        a.username,
        a.current_display_name,
        a.status,
        ds.session_state,
        ds.last_activity_at
      FROM accounts a
      LEFT JOIN device_sessions ds ON ds.account_username = a.username
      WHERE a.device_id IS NOT NULL AND a.device_id != ''
      ORDER BY a.device_id, a.username
    `;

    // Find orphan sessions (logged in on device but no account record)
    const orphans = await sql<OrphanSession[]>`
      SELECT DISTINCT
        ds.device_id,
        ds.account_username,
        ds.session_state
      FROM device_sessions ds
      LEFT JOIN accounts a ON a.username = ds.account_username
      WHERE a.id IS NULL
      ORDER BY ds.device_id
    `;

    // Print device summary
    console.log('DEVICE SUMMARY:');
    console.log(`Total devices: ${devices.length}`);
    
    let totalAccounts = 0;
    let totalLoggedIn = 0;
    let totalActive = 0;

    devices.forEach(d => {
      totalAccounts += Number(d.account_count);
      totalLoggedIn += Number(d.logged_in_count);
      totalActive += Number(d.active_count);
    });

    console.log(`Total accounts on devices: ${totalAccounts}`);
    console.log(`Logged in: ${totalLoggedIn}`);
    console.log(`Active: ${totalActive}`);
    console.log();

    // Print device details
    console.log('DEVICES (sorted by pending posts):');
    const accountMap = new Map<string, AccountInfo[]>();
    accounts.forEach(acc => {
      if (!accountMap.has(acc.device_id)) {
        accountMap.set(acc.device_id, []);
      }
      accountMap.get(acc.device_id)!.push(acc);
    });

    devices.forEach(device => {
      const accs = accountMap.get(device.device_id) || [];
      const loggedIn = accs.filter(a => a.session_state === 'logged_in');
      
      console.log(`\n📱 ${device.device_id}`);
      console.log(`   Accounts: ${device.account_count} | Logged in: ${device.logged_in_count}`);
      
      if (loggedIn.length > 0) {
        console.log(`   ✅ Logged in:`);
        loggedIn.forEach(a => {
          console.log(`      • @${a.username} (${a.current_display_name})`);
        });
      }
    });

    // Print orphan sessions
    if (orphans.length > 0) {
      console.log('\n\n⚠️  ORPHAN SESSIONS (logged in but no account):');
      orphans.forEach(o => {
        console.log(`   ${o.device_id}: @${o.account_username} (${o.session_state})`);
      });
    } else {
      console.log('\n✅ No orphan sessions found');
    }

    // Return JSON for processing
    console.log('\n\n=== JSON OUTPUT ===');
    console.log(JSON.stringify({ devices, accounts, orphans }, null, 2));

  } catch (err) {
    console.error('Audit failed:', (err as Error).message);
    process.exit(1);
  }
}

auditFleet();
