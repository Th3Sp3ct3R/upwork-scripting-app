import { ResumeService } from '@/services/ResumeService';
import * as claudeLib from '@/lib/claude';

jest.mock('@/lib/claude');
jest.mock('@/db');

describe('ResumeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCustomizedResume', () => {
    it('should generate a customized resume', async () => {
      const mockClaudeResponse = {
        resume: 'Customized resume content...',
        summary: 'Summary of changes...',
      };

      (claudeLib.generateCustomizedResume as jest.Mock).mockResolvedValue(
        mockClaudeResponse
      );

      // Mock the getOriginalResume method
      jest.spyOn(ResumeService, 'getOriginalResume').mockResolvedValue(
        'Original resume content...'
      );

      const result = await ResumeService.generateCustomizedResume({
        userId: 'test-user-id',
        jobDescription: 'We are looking for...',
        jobTitle: 'Senior Developer',
        companyName: 'TechCorp',
      });

      expect(result).toHaveProperty('resumeId');
      expect(result).toHaveProperty('customizedText');
      expect(result).toHaveProperty('summary');
      expect(result.customizedText).toBe('Customized resume content...');
    });

    it('should throw error if no original resume found', async () => {
      jest.spyOn(ResumeService, 'getOriginalResume').mockRejectedValue(
        new Error('User profile not found')
      );

      await expect(
        ResumeService.generateCustomizedResume({
          userId: 'test-user-id',
          jobDescription: 'We are looking for...',
          jobTitle: 'Senior Developer',
          companyName: 'TechCorp',
        })
      ).rejects.toThrow('User profile not found');
    });
  });
});
