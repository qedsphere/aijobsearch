import { GoogleGenAI, Type, Content } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCoverLetter = async (
  company: string, 
  role: string, 
  description: string, 
  userSkills: string = "general professional skills"
): Promise<string> => {
  try {
    const prompt = `
      Write a professional and engaging cover letter for the position of ${role} at ${company}.
      
      Job Description:
      ${description}
      
      My Skills/Background:
      ${userSkills}
      
      Keep it concise (under 300 words), professional, and enthusiastic. 
      Do not include placeholders like [Your Name] or [Address], start directly with "Dear Hiring Manager,".
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate cover letter. Please try again.";
  } catch (error) {
    console.error("Error generating cover letter:", error);
    return "Error generating cover letter. Please check your API key.";
  }
};

export const generateInterviewGuide = async (
  company: string,
  role: string,
  description: string
): Promise<string> => {
  try {
    const prompt = `
      Create a comprehensive interview preparation guide for the role of ${role} at ${company}.
      
      Leverage your existing knowledge about ${company} (culture, products, industry standing) combined with the Job Description below.
      
      Job Description provided:
      ${description}
      
      The guide must include:
      1. **Company & Role Insight**: Brief analysis of ${company}'s current focus and what they likely value in this ${role} role.
      2. **Key Technical/Soft Skills**: What specific skills from the description should be emphasized.
      3. **5 Potential Interview Questions**: Specific to ${company} and this role, with brief tips on how to answer.
      4. **3 Questions to Ask the Interviewer**: Strategic questions showing deep interest in ${company}.
      
      Format the output clearly with headings and bullet points. Keep it practical and ready to use.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate interview guide. Please try again.";
  } catch (error) {
    console.error("Error generating interview guide:", error);
    return "Error generating interview guide. Please check your API key.";
  }
};

export const parseAndImproveResume = async (fileBase64: string, mimeType: string): Promise<any> => {
  try {
    const base64Data = fileBase64.split(',')[1] || fileBase64;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            text: `Analyze this resume document. Extract all the information and rewrite the content to be more professional, impactful, and concise using strong action verbs.
            
            Return the result strictly as a JSON object matching this schema.
            Ensure dates are properly formatted. If a field is missing, use an empty string.
            IMPORTANT: Do NOT output any base64 strings, image data, or long random strings in your response.`
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            summary: { type: Type.STRING },
            skills: { type: Type.STRING },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  company: { type: Type.STRING },
                  date: { type: Type.STRING },
                  details: { type: Type.STRING },
                }
              }
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  company: { type: Type.STRING },
                  date: { type: Type.STRING },
                  details: { type: Type.STRING },
                }
              }
            },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  technologies: { type: Type.STRING },
                  link: { type: Type.STRING },
                  description: { type: Type.STRING },
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    // Sanity check to prevent parsing massive hallucinated strings
    if (text.length > 50000) {
      throw new Error("Response too large, likely hallucinated base64 data.");
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
};

export const improveResumeText = async (resume: any): Promise<any> => {
  try {
    const prompt = `
      Review the following resume data. Improve the professional summary, experience details, education details, and project descriptions to be more professional, impactful, and concise using strong action verbs.
      Fix any grammatical errors. Do not invent new experiences or skills, just improve the wording of what is already there.
      
      Current Resume:
      ${JSON.stringify(resume, null, 2)}
      
      Return the result strictly as a JSON object matching this schema.
      Ensure dates are properly formatted. If a field is missing, use an empty string.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            summary: { type: Type.STRING },
            skills: { type: Type.STRING },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  company: { type: Type.STRING },
                  date: { type: Type.STRING },
                  details: { type: Type.STRING },
                }
              }
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  company: { type: Type.STRING },
                  date: { type: Type.STRING },
                  details: { type: Type.STRING },
                }
              }
            },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  technologies: { type: Type.STRING },
                  link: { type: Type.STRING },
                  description: { type: Type.STRING },
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error improving resume text:", error);
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("quota")) {
      throw new Error("AI quota exceeded. Please wait a moment and try again.");
    }
    throw error;
  }
};

export const recommendRoles = async (resume: any, longTermGoals: string): Promise<any[]> => {
  try {
    const prompt = `
      You are an expert career advisor. Based on the user's resume and their long-term goals, recommend 3-5 specific job roles they should search for.
      
      User's Long-Term Goals:
      ${longTermGoals}
      
      User's Resume:
      ${JSON.stringify(resume, null, 2)}
      
      Return the result strictly as a JSON array of objects matching this schema:
      [{
        "role": "Specific Job Title (e.g., Frontend Developer, Data Scientist)",
        "reason": "A 1-2 sentence explanation of why this role aligns with their resume and long-term goals."
      }]
      
      IMPORTANT: Return ONLY the raw JSON array. Do not include markdown formatting like \`\`\`json or \`\`\`.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING },
              reason: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error recommending roles:", error);
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("quota")) {
      throw new Error("AI quota exceeded. Please wait a moment and try again.");
    }
    throw error;
  }
};

export const searchJobs = async (
  resume: any,
  preferences: {
    role: string;
    location: string;
    type: string;
    interests: string;
    timePeriod?: string;
  },
  onProgress?: (count: number) => void
): Promise<any[]> => {
  try {
    let allValidJobs: any[] = [];
    let allInvalidJobs: any[] = [];
    let iterations = 0;
    const MAX_ITERATIONS = 3;
    const TARGET_JOBS = 10;
    const today = new Date('2026-03-07T00:00:00-08:00');

    while (allValidJobs.length < TARGET_JOBS && iterations < MAX_ITERATIONS) {
      iterations++;
      const jobsNeeded = TARGET_JOBS - allValidJobs.length;
      
      let foundJobsContext = '';
      const allFoundJobs = [...allValidJobs, ...allInvalidJobs];
      if (allFoundJobs.length > 0) {
        foundJobsContext = `
      You have already found the following jobs. DO NOT return these again:
      ${allFoundJobs.map(j => `- ${j.title} at ${j.company} (${j.link})`).join('\n')}
        `;
      }

      const prompt = `
      You are an expert career advisor and job search assistant.
      
      I am looking for job opportunities with the following preferences:
      - Role/Keywords: ${preferences.role}
      - Location: ${preferences.location}
      - Type of work: ${preferences.type}
      - Interests/Desires: ${preferences.interests}
      ${preferences.timePeriod ? `- Time Period: ${preferences.timePeriod}` : ''}
      
      Here is my resume information:
      ${JSON.stringify(resume, null, 2)}
      ${foundJobsContext}
      
      Please search the web for ${jobsNeeded} CURRENT and REAL job listings that match my preferences.
      
      CRITICAL INSTRUCTIONS:
      1. Respond ONLY in English. Do not use any other languages (e.g., no Bengali, no Spanish, etc.).
      2. Ensure all fields are properly filled out with clean, readable text.
      3. The analysis fields MUST be complete sentences explaining the match. DO NOT leave them empty or use placeholders like "N/A" or "No analysis provided". You MUST write a custom analysis for each job based on the provided resume.
      4. Filter out any job applications that are no longer open (e.g., deadlines have passed). However, DO NOT filter out applications that will open in the future.
      5. STRICT EDUCATION FILTER: You MUST verify that the user's education (from the resume) meets the job's education requirements. If a job requires a higher degree than the user has (e.g., requires a Master's but user has a Bachelor's), you MUST NOT include it in the results. Instead, keep searching and parsing more jobs until you find exactly ${jobsNeeded} jobs that strictly match the user's education level.
      6. APPLICATION DEADLINE FILTER: You MUST find the application deadline for each job. If no application deadline is found, you MUST NOT include it in the results. Instead, keep searching and parsing more jobs until you find exactly ${jobsNeeded} jobs that have a clear application deadline.
      7. TIME PERIOD FILTER: If the user specified a Time Period (e.g., "Summer 2026"), evaluate if the job aligns with this time period. Set the \`matchesTimePeriod\` boolean field to true if it matches or if no time period was specified. Set it to false if it explicitly does not match the requested time period.
      8. SPECIFIC JOB LINKS ONLY: You MUST provide the exact, specific URL to the individual job posting. DO NOT provide general company homepages or generic career pages (e.g., "company.com/careers" or "company.com/jobs"). The link must go directly to the specific role you are recommending.

      For each job listing, evaluate it against my resume and preferences based on these 3 criteria:
      1. Interest: Does the topic match my desires or is it conceivably related in a meaningful intellectual sense?
      2. Minimum Qualification: Do I meet the minimum qualifications based on my resume?
      3. Location and type of work: Does it match my location and work type preferences?
      
      Calculate a matchScore from 0 to 100 based on these criteria. Be highly critical when calculating the matchScore. A score of 100 means a perfect match, 80 means a very strong match, 60 means a moderate match, and below 50 means a weak match. Do not inflate scores; most jobs should be in the 50-80 range unless it's a perfect fit.
      
      Return the result strictly as a JSON array of objects matching this schema:
      [{
        "id": "unique-string-id",
        "title": "Job Title",
        "company": "Company Name",
        "location": "Job Location",
        "type": "Full-time, Contract, etc.",
        "link": "URL to the job posting",
        "applicationDeadline": "The application deadline (e.g., 'March 15, 2026' or 'Rolling')",
        "matchScore": 85,
        "matchesTimePeriod": true,
        "analysis": {
          "interest": "Write a 1-2 sentence explanation of how the job aligns with the user's interests.",
          "qualifications": "Write a 1-2 sentence explanation of how the user's resume meets the job requirements.",
          "locationAndType": "Write a 1 sentence explanation of how the job matches the location and work type preferences."
        }
      }]
      
      IMPORTANT: Return ONLY the raw JSON array. Do not include markdown formatting like \`\`\`json or \`\`\`.
      `;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      let fullText = '';
      let currentBatchCount = 0;
      
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          // Count occurrences of "title" to estimate jobs parsed
          const currentCount = (fullText.match(/"title"\s*:/g) || []).length;
          if (currentCount > currentBatchCount) {
            currentBatchCount = currentCount;
            if (onProgress) onProgress(allValidJobs.length + currentBatchCount);
          }
        }
      }

      if (!fullText) continue;
      
      // Clean up potential markdown formatting just in case
      let cleanText = fullText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Extract the JSON array using regex in case there's extra text before or after
      const jsonMatch = cleanText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }
      
      let parsed: any[] = [];
      try {
        parsed = JSON.parse(cleanText);
      } catch (e) {
        console.error("Failed to parse JSON:", cleanText);
        continue;
      }

      // Classical check for deadline, link specificity, and required fields
      const validJobsInBatch: any[] = [];
      const invalidJobsFromClassicalChecks: any[] = [];

      parsed.forEach((job: any) => {
        let isValid = true;
        
        // Check for required fields
        if (!job.title || !job.company || !job.link) {
          isValid = false;
        } else {
          // Check link specificity
          try {
            const url = new URL(job.link);
            const path = url.pathname.toLowerCase().replace(/\/$/, ''); // remove trailing slash
            
            // Reject if it's just the root or a generic careers page
            if (path === '') isValid = false;
            
            const genericPaths = [
              '/careers', 
              '/jobs', 
              '/about/careers', 
              '/about/jobs', 
              '/work-with-us', 
              '/careers/jobs',
              '/career'
            ];
            if (genericPaths.includes(path)) isValid = false;
          } catch (e) {
            // Invalid URL format
            isValid = false;
          }

          // Check deadline
          if (job.applicationDeadline) {
            const deadlineDate = new Date(job.applicationDeadline);
            // If it's not a parsable date (e.g. "Rolling", "ASAP"), we keep it
            if (!isNaN(deadlineDate.getTime())) {
              if (deadlineDate < today) {
                isValid = false;
              }
            }
          }
        }

        if (isValid) {
          validJobsInBatch.push(job);
        } else {
          invalidJobsFromClassicalChecks.push({ ...job, isValid: false });
        }
      });

      // Async check for active job postings (valid links)
      const activeJobsPromises = validJobsInBatch.map(async (job: any) => {
        try {
          const checkRes = await fetch('/api/check-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: job.link })
          });
          const checkData = await checkRes.json();
          return { ...job, isValid: checkData.valid };
        } catch (e) {
          console.error("Error checking URL:", e);
          return { ...job, isValid: false }; // Keep as invalid if we can't verify
        }
      });
      
      const checkedJobs = await Promise.all(activeJobsPromises);
      const activeJobsInBatch = checkedJobs.filter(job => job.isValid);
      const invalidJobsInBatch = checkedJobs.filter(job => !job.isValid);

      // Ensure unique IDs to prevent React key collisions
      const newJobs = activeJobsInBatch.map((job: any) => ({
        ...job,
        id: job.id ? `${job.id}-${Math.random().toString(36).substring(2, 9)}` : `job-${Math.random().toString(36).substring(2, 9)}`
      }));

      const newInvalidJobs = invalidJobsInBatch.map((job: any) => ({
        ...job,
        id: job.id ? `${job.id}-${Math.random().toString(36).substring(2, 9)}` : `job-${Math.random().toString(36).substring(2, 9)}`
      }));

      const newInvalidClassicalJobs = invalidJobsFromClassicalChecks.map((job: any) => ({
        ...job,
        id: job.id ? `${job.id}-${Math.random().toString(36).substring(2, 9)}` : `job-${Math.random().toString(36).substring(2, 9)}`
      }));

      allValidJobs = [...allValidJobs, ...newJobs];
      allInvalidJobs = [...allInvalidJobs, ...newInvalidJobs, ...newInvalidClassicalJobs];
      
      if (onProgress) onProgress(allValidJobs.length);
    }

    // Sort valid jobs by matchScore descending
    allValidJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return [...allValidJobs.slice(0, TARGET_JOBS), ...allInvalidJobs];
  } catch (error: any) {
    console.error("Error searching jobs:", error);
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED" || error?.message?.includes("quota")) {
      throw new Error("AI quota exceeded. Please wait a moment and try again.");
    }
    throw error;
  }
};