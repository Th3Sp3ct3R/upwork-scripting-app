import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface GenerateResumeInput {
  originalResume: string;
  jobDescription: string;
  jobTitle: string;
  companyName: string;
}

export interface JobMatchInput {
  jobTitle: string;
  jobDescription: string;
  companyName: string;
  userProfile: string;
}

/**
 * Generate a customized resume for a specific job using Claude
 */
export async function generateCustomizedResume(
  input: GenerateResumeInput
): Promise<{ resume: string; summary: string }> {
  const prompt = `You are an expert resume writer specializing in tailoring resumes for specific job opportunities.

Original Resume:
${input.originalResume}

Job Title: ${input.jobTitle}
Company: ${input.companyName}

Job Description:
${input.jobDescription}

Please customize the resume to match this job description. Maintain the original structure but:
1. Highlight relevant skills and experiences
2. Reorder bullet points to emphasize most relevant achievements
3. Adjust language to match job description keywords
4. Keep the resume honest and truthful
5. Maintain professional formatting

Provide the customized resume in the same format as the original.`;

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const customizedResume =
    message.content[0].type === 'text' ? message.content[0].text : '';

  const summaryPrompt = `Summarize the key changes made to the resume for this ${input.jobTitle} position at ${input.companyName}. Be concise (2-3 sentences).`;

  const summaryMessage = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: summaryPrompt,
      },
    ],
  });

  const summary =
    summaryMessage.content[0].type === 'text' ? summaryMessage.content[0].text : '';

  return { resume: customizedResume, summary };
}

/**
 * Score how well a job matches the user's profile (0-100)
 */
export async function scoreJobMatch(input: JobMatchInput): Promise<{ score: number; reason: string }> {
  const prompt = `You are a career matching expert. Score how well a job matches a candidate's profile on a scale of 0-100.

Job Title: ${input.jobTitle}
Company: ${input.companyName}

Job Description:
${input.jobDescription}

Candidate Profile:
${input.userProfile}

Provide your assessment in the following JSON format:
{
  "score": <number 0-100>,
  "reason": "<brief explanation of the score>"
}

Consider factors like:
- Skill alignment
- Experience level requirements
- Location and salary expectations if mentioned
- Career progression fit
- Company culture fit if evident`;

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '{}';

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
    return {
      score: Math.min(100, Math.max(0, parseInt(result.score) || 50)),
      reason: result.reason || 'Unable to determine match reason',
    };
  } catch {
    return { score: 50, reason: 'Unable to analyze job match' };
  }
}

/**
 * Generate a cover letter tailored to a job
 */
export async function generateCoverLetter(
  userName: string,
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  userProfile: string
): Promise<string> {
  const prompt = `Write a professional cover letter for the following:

Candidate: ${userName}
Job Title: ${jobTitle}
Company: ${companyName}

Job Description:
${jobDescription}

Candidate Profile:
${userProfile}

Write a compelling 3-4 paragraph cover letter that:
1. Shows genuine interest in the role and company
2. Highlights key achievements relevant to the job
3. Demonstrates understanding of job requirements
4. Expresses enthusiasm for the opportunity`;

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return message.content[0].type === 'text' ? message.content[0].text : '';
}

/**
 * Analyze a job description to extract key requirements
 */
export async function analyzeJobDescription(jobDescription: string): Promise<{
  skills: string[];
  experience: string;
  seniority: string;
  keyRequirements: string[];
}> {
  const prompt = `Analyze this job description and extract key information:

${jobDescription}

Respond in JSON format:
{
  "skills": ["skill1", "skill2", ...],
  "experience": "X years of experience",
  "seniority": "junior|mid|senior|executive",
  "keyRequirements": ["requirement1", "requirement2", ...]
}`;

  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '{}';

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
  } catch {
    return {
      skills: [],
      experience: '',
      seniority: 'mid',
      keyRequirements: [],
    };
  }
}
