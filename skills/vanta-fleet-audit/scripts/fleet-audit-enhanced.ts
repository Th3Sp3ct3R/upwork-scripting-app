#!/usr/bin/env npx tsx
/**
 * VANTA Fleet Audit Enhanced
 * - Device mapping + logged-in accounts
 * - Model status (which models online/offline)
 * - Profile staleness (logged in but no recent changes)
 * - Missing model IDs
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface DeviceInfo {
  device_id: string;
  account_count: number;
  logged_in_count: number;
}

interface AccountInfo {
  device_id: string;
  username: string;
  current_display_name: string;
  status: string;
  session_state: string;
  model_id: number;
  model_name: string;
  profile_snapshot_at: string;
}

interface ModelStatus {
  model_id: number;
  model_name: string;
  online_count: number;
  total_count: number;
}

interface StaleProfile {
  username: string;
  current_display_name: string;
  session_state: string;
  profile_snapshot_at: string;
  hours_since_snapshot: number;
  model_id: number;
  model_name: string;
}

async function auditFleet() {
  try {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║         VANTA FLEET AUDIT — ENHANCED               ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    
    // Get device stats
    const devices = await sql<DeviceInfo[]>`
      SELECT 
        a.device_id,
        COUNT(a.id)::integer as account_count,
        SUM(CASE WHEN a.status = 'logged_in' THEN 1 ELSE 0 END)::integer as logged_in_count
      FROM accounts a
      WHERE a.device_id IS NOT NULL AND a.device_id != ''
      GROUP BY a.device_id
      ORDER BY a.device_id ASC
    `;

    // Get all accounts with profile freshness
    const accounts = await sql<AccountInfo[]>`
      SELECT
        a.device_id,
        a.username,
        a.current_display_name,
        a.status,
        ds.session_state,
        a.model_id,
        a.model_name,
        a.profile_snapshot_at
      FROM accounts a
      LEFT JOIN device_sessions ds ON ds.account_username = a.username
      WHERE a.device_id IS NOT NULL AND a.device_id != ''
      ORDER BY a.device_id, a.username
    `;

    // Get model status
    const modelStatus = await sql<ModelStatus[]>`
      SELECT 
        a.model_id,
        a.model_name,
        SUM(CASE WHEN ds.session_state = 'logged_in' THEN 1 ELSE 0 END)::integer as online_count,
        COUNT(a.id)::integer as total_count
      FROM accounts a
      LEFT JOIN device_sessions ds ON ds.account_username = a.username
      WHERE a.model_id IS NOT NULL AND a.model_id > 0
      GROUP BY a.model_id, a.model_name
      ORDER BY a.model_id ASC
    `;

    // Find stale profiles (logged in but no recent profile changes)
    const staleProfiles = await sql<StaleProfile[]>`
      SELECT
        a.username,
        a.current_display_name,
        ds.session_state,
        a.profile_snapshot_at,
        EXTRACT(HOUR FROM (NOW() - a.profile_snapshot_at))::integer as hours_since_snapshot,
        a.model_id,
        a.model_name
      FROM accounts a
      LEFT JOIN device_sessions ds ON ds.account_username = a.username
      WHERE ds.session_state = 'logged_in'
        AND a.profile_snapshot_at < NOW() - INTERVAL '24 hours'
      ORDER BY hours_since_snapshot DESC
    `;

    // Find missing models (1-38)
    const existingModelIds = modelStatus
      .map(m => m.model_id)
      .filter(id => id && id > 0)
      .sort((a, b) => a - b);
    
    const missingModels = [];
    for (let i = 1; i <= 38; i++) {
      if (!existingModelIds.includes(i)) {
        missingModels.push(i);
      }
    }

    // ========== DEVICE SUMMARY ==========
    console.log('📊 DEVICE SUMMARY');
    console.log('─'.repeat(50));
    
    let totalAccounts = 0;
    let totalLoggedIn = 0;
    devices.forEach(d => {
      totalAccounts += d.account_count;
      totalLoggedIn += d.logged_in_count;
    });

    console.log(`Total devices:              ${devices.length}`);
    console.log(`Total accounts on devices:  ${totalAccounts}`);
    console.log(`Logged in sessions:         ${totalLoggedIn}`);
    console.log();

    // ========== MODEL STATUS ==========
    console.log('👥 MODEL STATUS (Expected: 1-38)');
    console.log('─'.repeat(50));
    
    modelStatus.forEach(m => {
      const online = m.online_count;
      const total = m.total_count;
      const onlineIcon = online > 0 ? '✅' : '❌';
      console.log(`Model ${String(m.model_id).padStart(2, '0')}: ${onlineIcon} ${(m.model_name || '???').padEnd(25)} ${online}/${total}`);
    });

    if (missingModels.length > 0) {
      console.log(`\n⚠️  MISSING MODELS (Not in system): ${missingModels.join(', ')}`);
    }
    console.log();

    // ========== STALE PROFILES ==========
    if (staleProfiles.length > 0) {
      console.log('🚨 STALE PROFILES (Logged in but no recent changes)');
      console.log('─'.repeat(50));
      console.log('(>24h since last profile snapshot)\n');
      
      staleProfiles.forEach(p => {
        const hours = p.hours_since_snapshot || 0;
        const days = Math.floor(hours / 24);
        const timeStr = days > 0 ? `${days}d ${hours % 24}h` : `${hours}h`;
        console.log(`@${p.username.padEnd(30)} Model: ${String(p.model_id).padStart(2, '0')} | Stale: ${timeStr}`);
        console.log(`  Display: "${p.current_display_name}"`);
        console.log(`  Last snapshot: ${new Date(p.profile_snapshot_at).toLocaleDateString()}`);
        console.log();
      });
    } else {
      console.log('✅ STALE PROFILES: None found (all profiles fresh)\n');
    }

    // ========== DEVICE DETAILS ==========
    console.log('🔧 DEVICE DETAILS (with logged-in accounts)');
    console.log('─'.repeat(50));
    
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
      
      if (loggedIn.length > 0) {
        console.log(`\n📱 ${device.device_id}`);
        console.log(`   Total: ${device.account_count} | Logged in: ${loggedIn.length}`);
        console.log(`   Accounts:`);
        loggedIn.forEach(a => {
          const modelStr = a.model_id ? `Model ${a.model_id}` : 'NO MODEL';
          console.log(`      ✅ @${a.username.padEnd(35)} (${modelStr})`);
        });
      }
    });

    console.log('\n');

    // ========== JSON OUTPUT ==========
    console.log('=== JSON OUTPUT ===');
    console.log(JSON.stringify({
      summary: {
        devices: devices.length,
        accounts: totalAccounts,
        logged_in: totalLoggedIn,
        stale_profiles: staleProfiles.length,
        missing_models: missingModels
      },
      model_status: modelStatus,
      stale_profiles: staleProfiles,
      devices,
      accounts,
      missing_models: missingModels
    }, null, 2));

  } catch (err) {
    console.error('❌ Audit failed:', (err as Error).message);
    process.exit(1);
  }
}

auditFleet();
