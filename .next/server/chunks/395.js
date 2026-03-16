exports.id=395,exports.ids=[395],exports.modules={2499:(a,b,c)=>{"use strict";c.d(b,{zo:()=>K,jw:()=>I,zM:()=>J});var d=c(9618);let e="Tota";var f=c(4364);let g=process.env.GEMINI_API_KEY,h=g?new f.ij(g):null,i=h?.getGenerativeModel({model:"gemini-2.5-flash"});function j(a){return a instanceof Error?a.message:"Unknown Gemini API error."}async function k(a,b){if(!i)throw Error("Missing GEMINI_API_KEY.");(0,d.M)("gemini.requestText.start",{label:b?.debugLabel??"unknown",maxOutputTokens:b?.maxOutputTokens??120,temperature:b?.temperature??.4,promptPreview:a.slice(0,240)});let c=(await i.generateContent({contents:[{role:"user",parts:[{text:a}]}],generationConfig:{temperature:b?.temperature??.4,maxOutputTokens:b?.maxOutputTokens??120}})).response.text().trim();return(0,d.M)("gemini.requestText.result",{label:b?.debugLabel??"unknown",raw:c}),c||null}async function l(a,b){let c=b?.retries??2,e=null;try{let c=await k(a,b);if(c)return c}catch(a){(0,d.v)("gemini.generateText.firstTry",a,{label:b?.debugLabel??"unknown"}),e=a}if(c<2){if(e)throw Error(j(e));return null}try{return await k(`${a}

IMPORTANT:
- Return plain text only.
- Keep it concise and natural.
`,b)}catch(a){(0,d.v)("gemini.generateText.secondTry",a,{label:b?.debugLabel??"unknown"}),e=a}if(e)throw Error(j(e));return null}async function m(a,b,c){let d=null;try{d=await l(a,c)}catch(a){throw Error(`Gemini could not generate ${b}. ${j(a)}`)}if(!d)throw Error(`Gemini could not generate ${b}.`);return d}function n(a){return a.trim().replace(/[^a-zA-Z\s'-]/g,"").split(/\s+/).filter(Boolean).slice(0,2).map(a=>a.charAt(0).toUpperCase()+a.slice(1).toLowerCase()).join(" ")}function o(a){let b=a.replace(/\b(hi|hello|hey|toota|tota)\b/gi," ").replace(/\s+/g," ").trim(),c=function(a){let b=a.toLowerCase().replace(/[^a-z\s]/g," ").split(/\s+/).filter(Boolean);if(!(b.length<3)&&b.every(a=>/^[a-z]$/.test(a)))return n(b.join(""))}(b);if(c)return c;for(let a of[/\bmy name is ([a-zA-Z][a-zA-Z'-]{1,30}(?:\s+[a-zA-Z][a-zA-Z'-]{1,30})?)\b/i,/\bi am ([a-zA-Z][a-zA-Z'-]{1,30}(?:\s+[a-zA-Z][a-zA-Z'-]{1,30})?)\b/i,/\bit'?s ([a-zA-Z][a-zA-Z'-]{1,30}(?:\s+[a-zA-Z][a-zA-Z'-]{1,30})?)\b/i]){let c=b.match(a);if(c?.[1])return n(c[1])}let d=b.match(/^[a-zA-Z][a-zA-Z'-]{1,30}$/);if(d?.[0])return n(d[0]);let e=b.match(/^[a-zA-Z][a-zA-Z'-]{1,30}\s+[a-zA-Z][a-zA-Z'-]{1,30}$/);if(e?.[0])return n(e[0])}function p(a,b){if(!a)return null;let c=a.match(/MODE:\s*(candidate|confirmed|retry|spell)/i)?.[1]?.toLowerCase();if(!c||!b.includes(c))return null;let d=a.match(/CANDIDATE:\s*(.+)/i)?.[1]?.trim(),e=a.match(/REPLY:\s*(.+)/i)?.[1]?.trim();return{mode:c,candidate:d&&"NONE"!==d.toUpperCase()?n(d):void 0,reply:e}}function q(a,b){return"spell"===a?"I want to get it right. Can you spell your name for me, one letter at a time?":"candidate"===a&&b?`I heard ${b}. Is that right?`:"confirmed"===a?"Great! Thanks for confirming.":"I did not catch that clearly. Could you say your name again?"}async function r(a,b){try{return await l(a,{maxOutputTokens:80,retries:2,temperature:.1,debugLabel:b})}catch(a){return(0,d.M)("intro-worker.decision.error",{label:b,error:a instanceof Error?a.message:String(a)}),null}}async function s(){let a=(await m(`
You are ${e}, a warm voice-first English tutor.
Write one short opening message for a new learner.

Rules:
- 1 or 2 short sentences.
- Say your name is ${e}.
- Ask for the learner's name.
`,"welcome message",{maxOutputTokens:50,retries:2,temperature:.4,debugLabel:"intro-welcome"})).replace(/\s+/g," ").trim();if(!a||a.split(" ").length<4)return`Hi, I'm ${e}, your English coach. What's your name?`;a=a.replace(/\bPip\b/gi,e);let b=/what(?:'s| is) your name\??/i.test(a)||/may i know your name\??/i.test(a);return/\b(it|i|my|your|and|so|because|hello)$/i.test(a)||!/[.?!]$/.test(a)?`Hi, I'm ${e}, your English coach. What's your name?`:b?a:`${a.replace(/[.?!]*$/,".")} What's your name?`}async function t(a,b,c=0){let f=`
You are ${e}. Extract the learner name.
Step: ${b}
Attempts: ${c}
Transcript: ${a}

Return exactly:
MODE: candidate|retry|spell
CANDIDATE: name or NONE
REPLY: short tutor reply

Rules:
- candidate if a name is clearly present
- spell if they need to spell it
- retry otherwise
`,g=await r(f,"intro-name-candidate"),h=p(g,["candidate","retry","spell"]);if(h){let a=h.reply??q(h.mode,h.candidate);return{mode:h.mode,candidate:h.candidate,reply:a}}let i=function(a,b){let c=o(a),d=c?"candidate":b>=2?"spell":"retry",e="candidate"===d&&c?`I heard ${c}. Is that right?`:q(d);return{mode:d,candidate:c,reply:e}}(a,c);return(0,d.M)("intro-worker.candidate.fallback",{transcript:a,attempts:c,fallbackMode:i.mode,raw:g??null}),i}async function u(a,b,c=0){let f=`
You are ${e}. Confirm the learner name.
Pending name: ${b}
Attempts: ${c}
Transcript: ${a}

Return exactly:
MODE: confirmed|candidate|retry|spell
CANDIDATE: corrected name or NONE
REPLY: short tutor reply

Rules:
- confirmed if learner confirms
- candidate if learner gives a different name
- spell if learner wants to spell it
- retry otherwise
`,g=p(await r(f,"intro-name-confirmation"),["confirmed","candidate","retry","spell"]);if(g){let c=g.reply??q(g.mode,g.candidate);return(0,d.M)("intro-worker.confirmation",{transcript:a,pendingName:b,mode:g.mode,candidate:g.candidate??null}),{mode:g.mode,candidate:g.candidate,reply:c}}let h=function(a,b){let c=o(a),d=c?"candidate":b>=2?"spell":"retry",e="candidate"===d&&c?`I heard ${c}. Is that right?`:"spell"===d?"No problem. Can you spell your name for me, one letter at a time?":"I want to make sure I got it right. Could you confirm your name again?";return{mode:d,candidate:c,reply:e}}(a,c);return(0,d.M)("intro-worker.confirmation.fallback",{transcript:a,pendingName:b,attempts:c,fallbackMode:h.mode}),h}function v(a){let b=a.replace(/\s+/g," ").trim();return b.split(" ").filter(Boolean).length>=6&&/[?]$/.test(b)&&!/^(question|so|tell me|okay|sure)\b/i.test(b)}function w(a){return 1===a?["Can you tell me a little about your daily routine?","What do you usually do in the morning before work or study?","Can you introduce yourself and talk about a normal day for you?","What kind of things do you do on a typical weekday?","Can you describe your day from morning to evening?"]:2===a?["What did you do last weekend, and how was it?","Can you tell me about something you did recently after work or class?","How do you usually spend your evenings on weekdays?","What is one thing you did this week that you enjoyed?","Can you describe a recent day that was different from usual?"]:["Why do you want to improve your English right now?","What makes speaking English easy or difficult for you?","How do you think English can help you in your future?","What is something you enjoy learning, and why do you like it?","If you could speak English confidently, what would you like to do first?"]}async function x(a,b,c,e){let f=c.map(a=>a.question).join(" | "),g=e.map((a,b)=>`Q${b+1}: ${a.question}
A${b+1}: ${a.answer}`).join("\n\n"),h=w(b),i="";for(let c=1;c<=3;c+=1)try{let e=await m(`
Choose the best question ${b} of 3 for a spoken English placement test for ${a}.
Goal: ${1===b?"Ask about daily life or self-introduction in simple spoken English.":2===b?"Ask about routine, time, or a recent past activity.":"Ask for an opinion, explanation, or a more detailed answer."}
Previous questions: ${f||"None"}
Previous answers: ${g||"None yet"}

Return exactly:
OPTION: 1 | 2 | 3 | 4 | 5

Rules:
- Pick one option only
- Do not add explanation

Options:
1. ${h[0]}
2. ${h[1]}
3. ${h[2]}
4. ${h[3]}
5. ${h[4]}
`,"placement question",{maxOutputTokens:40,retries:2,temperature:.1,debugLabel:`placement-q${b}-attempt-${c}`});i=e;let j=Number(e.match(/OPTION:\s*([1-5])/i)?.[1]??"0"),k=j>=1&&j<=5?h[j-1]:void 0;if((0,d.M)("placement-worker.question",{name:a,questionNumber:b,attempt:c,raw:e,optionIndex:j||null,parsedQuestion:k??null,valid:!!k&&v(k)}),k&&v(k))return{id:`q${b}`,question:k}}catch(e){i=e instanceof Error?e.message:String(e),(0,d.M)("placement-worker.question.error",{name:a,questionNumber:b,attempt:c,error:i})}let j=w(b)[0];return(0,d.M)("placement-worker.question.fallback",{name:a,questionNumber:b,fallback:j,lastRaw:i}),{id:`q${b}`,question:j}}async function y(a,b,c){let d=(await m(`
You are ${e}, a warm English tutor.
Learner: ${a}
Write one short spoken transition after a learner answered a placement question.
Then ask this exact next question: ${c}

Rules:
- 1 or 2 short sentences
- Friendly and natural
- End with the exact next question
`,"placement transition",{maxOutputTokens:80,retries:1,temperature:.3,debugLabel:`placement-transition-${b}`})).replace(/\s+/g," ").trim();return d.split(" ").length<4||!d.includes(c)?`Thanks, ${a}. Here is the next question: ${c}`:d}async function z(a,b){let c=a.map((a,b)=>`Q${b+1}: ${a.question}
A${b+1}: ${a.answer}`).join("\n\n"),d=await m(`
You are ${e}, reviewing a spoken English placement test for ${b}.

Responses:
${c}

Return exactly in this format:
LEVEL: Beginner|Intermediate|Advanced
SUMMARY: ...
STRENGTHS: item 1 | item 2 | item 3
FOCUS: item 1 | item 2 | item 3
STYLE: ...
CONVO_SUMMARY: ...
PRIORITIES: item 1 | item 2 | item 3
REPORT_INTRO: ...
`,"placement review",{maxOutputTokens:220,retries:2,temperature:.2,debugLabel:"placement-review"}),f=d.match(/LEVEL:\s*(Beginner|Intermediate|Advanced)/i)?.[1]??"Beginner",g=d.match(/SUMMARY:\s*(.+)/i)?.[1]?.trim()??"You can communicate some ideas, and we will build more fluency and clarity from here.",h=(d.match(/STRENGTHS:\s*(.+)/i)?.[1]??"").split("|").map(a=>a.trim()).filter(Boolean).slice(0,3),i=(d.match(/FOCUS:\s*(.+)/i)?.[1]??"").split("|").map(a=>a.trim()).filter(Boolean).slice(0,3),j=d.match(/STYLE:\s*(.+)/i)?.[1]?.trim()??"The learner can respond, but needs more smoothness and control.",k=d.match(/CONVO_SUMMARY:\s*(.+)/i)?.[1]?.trim()??"The learner can answer simple prompts and is building confidence in spoken English.",l=(d.match(/PRIORITIES:\s*(.+)/i)?.[1]??"").split("|").map(a=>a.trim()).filter(Boolean).slice(0,3),n=d.match(/REPORT_INTRO:\s*(.+)/i)?.[1]?.trim()??"Your assessment is ready.";return{report:{level:f,summary:g,strengths:h.length?h:["Comfort with simple replies","Willingness to speak","Good starting confidence"],focusAreas:i.length?i:["Longer sentences","Clearer grammar","More detail in answers"]},learnerProfile:{conversationSummary:k,speakingStyle:j,strengths:h.length?h:["Comfort with simple replies","Willingness to speak","Good starting confidence"],growthAreas:i.length?i:["Longer sentences","Clearer grammar","More detail in answers"],lessonPriorities:l.length?l:["Fluency in daily conversation","Better sentence building","Explaining ideas clearly"]},reportIntro:n}}async function A(a,b,c){try{let d=await m(`
You are ${e}, creating a spoken English learning path for ${c}.
Level: ${a.level}
Summary: ${a.summary}
Speaking style: ${b.speakingStyle}
Growth areas: ${b.growthAreas.join(", ")}
Priorities: ${b.lessonPriorities.join(", ")}

Return exactly:
TOPIC1: title | reason | outcome 1 | outcome 2 | outcome 3
TOPIC2: title | reason | outcome 1 | outcome 2 | outcome 3
TOPIC3: title | reason | outcome 1 | outcome 2 | outcome 3
TOPIC4: title | reason | outcome 1 | outcome 2 | outcome 3
`,"learning path",{maxOutputTokens:260,retries:2,temperature:.2,debugLabel:"path-learning-path"}),f=[1,2,3,4].map(a=>d.match(RegExp(`TOPIC${a}:\\s*(.+)`,"i"))?.[1]?.trim()).filter(a=>!!a).map((a,b)=>{let[c,d,...e]=a.split("|").map(a=>a.trim()).filter(Boolean);return{id:`topic-${b+1}`,title:c??`Topic ${b+1}`,reason:d??"A useful next speaking step.",outcomes:e.slice(0,3)}});if(4!==f.length||f.some(a=>a.outcomes.length<3))throw Error(`Gemini returned an invalid learning path. Raw response: ${d}`);return f}catch{let c=b.growthAreas.length?b.growthAreas:a.focusAreas.length?a.focusAreas:["Fluency","Grammar","Speaking confidence"];return[{id:"topic-1",title:"Daily Conversation",reason:`This helps you speak more naturally about everyday life and routines at your ${a.level.toLowerCase()} level.`,outcomes:["Talk about your day more smoothly","Answer common personal questions","Use longer everyday sentences"]},{id:"topic-2",title:"Past And Present Speaking",reason:`This targets time-based speaking, especially around ${c[0]??"sentence control"}.`,outcomes:["Describe recent events clearly","Use time words more naturally","Connect ideas in sequence"]},{id:"topic-3",title:"Opinions And Explanations",reason:`This builds confidence in explaining ideas, which supports ${c[1]??"clearer grammar"}.`,outcomes:["Give reasons for your ideas","Speak with more detail","Respond to follow-up questions"]},{id:"topic-4",title:"Confidence And Corrections",reason:`This helps improve ${c[2]??"speaking confidence"} through guided speaking and correction.`,outcomes:["Notice and fix small mistakes","Speak with better rhythm","Build more confidence in live conversation"]}]}}async function B(a,b,c){let d=(await m(`
You are ${e}, a friendly English tutor.
Learner: ${a}
Level: ${b}
Topics: ${c.map(a=>a.title).join(", ")}

Write 1 or 2 short sentences inviting the learner to choose a topic.
`,"path intro",{maxOutputTokens:60,retries:1,temperature:.3,debugLabel:"path-intro"})).replace(/\s+/g," ").trim();return d.split(" ").length<4?`${a}, your learning path is ready. Choose a topic and we will start your next voice lesson.`:d}function C(a,b){return{coachGoal:`Build stronger ${a.title.toLowerCase()} skills with clearer sentences and more confidence.`,overview:`This lesson helps you speak more naturally about ${a.title.toLowerCase()} through correction, choice practice, and a final voice quiz.`,endGoal:`By the end of this lesson, you should be able to answer with more detail, better grammar, and more confidence at a ${b.toLowerCase()} level.`,kickoff:`Welcome to your ${a.title} lesson. First, we will warm up with sentence correction, then you will try quick multiple-choice practice, and after that you will finish with a short voice quiz.`}}async function D(a,b,c,d){let f=[{id:"correction-1",title:"Fix the daily sentence",incorrectSentence:"Yesterday I go to market and buy vegetables.",hint:"Use the correct past tense for both verbs."},{id:"correction-2",title:"Fix the time sentence",incorrectSentence:"I am usually wake up at 7 and drinking tea.",hint:"Make the routine sentence natural and grammatically correct."},{id:"correction-3",title:"Fix the detail sentence",incorrectSentence:"My friend tell me that English are very important for job.",hint:"Correct the verb forms and the noun agreement."},{id:"correction-4",title:`Fix the ${a.title.toLowerCase()} sentence`,incorrectSentence:"I want improve my speaking because I not feel confidence.",hint:"Make the sentence smoother and more natural."}],g=[{id:"mcq-1",question:"Which sentence is correct?",options:["He go to work every day.","He goes to work every day.","He going to work every day.","He gone to work every day."],correctIndex:1,explanation:"For he/she/it in the present simple, we usually add -s to the verb."},{id:"mcq-2",question:"Which sentence talks correctly about the past?",options:["I visit my aunt yesterday.","I am visiting my aunt yesterday.","I visited my aunt yesterday.","I visits my aunt yesterday."],correctIndex:2,explanation:"Yesterday usually takes the past tense form."},{id:"mcq-3",question:"Which response gives a clear opinion?",options:["Because yes.","I think it is useful because it helps me at work.","Useful because.","I useful work English."],correctIndex:1,explanation:"A clear opinion usually includes both an idea and a reason."},{id:"mcq-4",question:"Which sentence sounds most natural?",options:["I am liking to learn English.","I like learning English.","I like learn English.","I liking English learn."],correctIndex:1,explanation:"Like + gerund is a common and natural pattern here."}],h=[{id:"quiz-1",prompt:"Talk about what you usually do in the morning.",target:"Use a clear routine sentence with time words."},{id:"quiz-2",prompt:"Describe one thing you did yesterday.",target:"Use the past tense correctly."},{id:"quiz-3",prompt:"Give your opinion about learning English.",target:"Share one opinion and one reason."},{id:"quiz-4",prompt:`Say one longer sentence connected to ${a.title.toLowerCase()}.`,target:"Use a connector like because, and, but, or so."},{id:"quiz-5",prompt:"Introduce yourself in 3 or 4 natural sentences.",target:"Speak smoothly with confidence and detail."}],i=["Listen to a wrong sentence and say a better version.","Choose the strongest answer in quick multiple-choice rounds.","Finish with short voice answers in the final quiz."],j=f.map(a=>a.incorrectSentence).slice(0,3);try{let k=await m(`
You are ${e}, building a voice-only English lesson for ${c}.
Level: ${b}
Topic: ${a.title}
Reason: ${a.reason}
Outcomes: ${a.outcomes.join(", ")}
Speaking style: ${d?.speakingStyle??"Unknown"}
Growth areas: ${d?.growthAreas.join(", ")??"Unknown"}

Return exactly:
GOAL: ...
OVERVIEW: ...
END_GOAL: ...
KICKOFF: ...
`,"lesson bundle",{maxOutputTokens:140,retries:2,temperature:.2,debugLabel:"lesson-bundle"}),l=k.match(/GOAL:\s*(.+)/i)?.[1]?.trim()??C(a,b).coachGoal,n=k.match(/OVERVIEW:\s*(.+)/i)?.[1]?.trim()??C(a,b).overview,o=k.match(/END_GOAL:\s*(.+)/i)?.[1]?.trim()??C(a,b).endGoal,p=k.match(/KICKOFF:\s*(.+)/i)?.[1]?.trim()??C(a,b).kickoff;return{bundle:{topicId:a.id,topicTitle:a.title,coachGoal:l,overview:n,endGoal:o,outcomes:a.outcomes,lessonSteps:i,practicePrompts:j,correctionRounds:f,mcqs:g,finalQuiz:h},kickoff:p}}catch{let c=C(a,b);return{bundle:{topicId:a.id,topicTitle:a.title,coachGoal:c.coachGoal,overview:c.overview,endGoal:c.endGoal,outcomes:a.outcomes,lessonSteps:i,practicePrompts:j,correctionRounds:f,mcqs:g,finalQuiz:h},kickoff:c.kickoff}}}async function E(a,b,c,d,f,g,h){let i=(await m(`
You are ${e}, a live spoken English tutor.
Learner: ${b}
Level: ${a}
Topic: ${f?.topicTitle??"General speaking"}
Goal: ${f?.coachGoal??"Build fluency and confidence"}
Prompts: ${f?.practicePrompts.join(" | ")??"None"}
Speaking style: ${g?.speakingStyle??"Unknown"}
Growth areas: ${g?.growthAreas.join(", ")??"Unknown"}
Previous question: ${h??"No question yet."}

Recent lesson turns:
${d.filter(a=>"LESSON"===a.phase).slice(-8).map(a=>`${a.role.toUpperCase()}: ${a.text}`).join("\n")}

Latest learner message:
${c}

Write 2 to 4 short sentences. Speak naturally and keep the focus on the current topic.
Rules:
- Remind the learner gently. Keep corrections light.
- Offer a follow-up spoken prompt or question.
- Keep it on the current topic.
`,"lesson reply",{maxOutputTokens:140,retries:1,temperature:.3,debugLabel:"lesson-live-reply"})).replace(/\s+/g," ").trim();return i.split(" ").length<5?"Good try. Let's keep going. Can you answer that again with a little more detail?":i}function F(a,b,c,d=a.phase,e){a.messages.push({id:crypto.randomUUID(),role:b,phase:d,text:c,createdAt:new Date().toISOString()}),"LESSON"===d&&"tutor"===b&&e?.isQuestion&&(a.currentLessonQuestion=c)}async function G(a,b){var c;a.profile.name=b,a.pendingName=void 0,a.introAttempts=0,a.introStep="completed",a.phase="PLACEMENT",a.currentLessonQuestion=void 0,F(a,"tutor",`Welcome ${b}! ${e} will guide you through a short spoken placement test so we can tailor the path we build together. Take a breath, we will begin with a friendly question about your day.`,"PLACEMENT"),a.placementQuestions=[await x(b,1,[],[])];let d=(c=a.placementQuestions[0].question,`Welcome ${b}. I am ${e}, your voice-first English coach. We will do a short placement test so I can understand your current English and build the right learning path for you. First question: ${c}`);F(a,"tutor",d,"PLACEMENT")}async function H(a){let b=a.profile.name??"there",c=await z(a.placementAnswers,b),d=await A(c.report,c.learnerProfile,b);a.profile.level=c.report.level,a.profile.learnerProfile=c.learnerProfile,a.report=c.report,a.learningPath=d,a.phase="REPORT",F(a,"tutor",c.reportIntro,"REPORT")}async function I(){let a={id:crypto.randomUUID(),phase:"INTRO",profile:{},messages:[],introStep:"awaiting_name",introAttempts:0,placementQuestions:[],placementIndex:0,placementAnswers:[]};return F(a,"tutor",await s(),"INTRO"),(0,d.M)("tutor.createSession",{sessionId:a.id,phase:a.phase}),a}function J(a){return{sessionId:a.id,phase:a.phase,profile:a.profile,messages:a.messages,report:a.report,learningPath:a.learningPath,currentTopicId:a.currentTopicId,lessonBundle:a.lessonBundle,currentLessonQuestion:a.currentLessonQuestion,lessonQueue:a.lessonQueue,currentQueueIndex:a.currentQueueIndex,placementProgress:{current:Math.min(a.placementIndex+ +("PLACEMENT"===a.phase),a.placementQuestions.length||3),total:"PLACEMENT"===a.phase?3:a.placementQuestions.length||3}}}async function K(a,b,c,e){if((0,d.M)("tutor.advanceSession.start",{sessionId:a.id,phase:a.phase,introStep:a.introStep,action:c??null,topicId:e??null,transcript:b??null}),"continue"===c&&"REPORT"===a.phase)return a.phase="PATH",F(a,"tutor",await B(a.profile.name??"there",a.profile.level??"Beginner",a.learningPath??[]),"PATH"),a;if("select-topic"===c&&"PATH"===a.phase&&e){let b=a.learningPath?.find(a=>a.id===e);if(!b)throw Error("Lesson topic could not be selected.");let c=await D(b,a.profile.level??"Beginner",a.profile.name??"there",a.profile.learnerProfile);if(a.phase="LESSON",a.currentTopicId=b.id,a.lessonBundle=c.bundle,a.lessonQueue=function(a){let b=a.correctionRounds.map((a,b)=>({id:a.id,type:"correction",label:`Correction ${b+1}`,text:`Fix this sentence: ${a.incorrectSentence}. Hint: ${a.hint}`}));return[...b,...a.mcqs.map((a,b)=>({id:a.id,type:"mcq",label:`MCQ ${b+1}`,text:`${a.question} Options: ${a.options.map((a,b)=>`${String.fromCharCode(65+b)}) ${a}`).join(", ")}`})),...a.finalQuiz.map((a,b)=>({id:a.id,type:"quiz",label:`Quiz ${b+1}`,text:`Quiz prompt: ${a.prompt}`}))]}(c.bundle),a.currentQueueIndex=0,F(a,"tutor",c.kickoff,"LESSON"),a.lessonQueue?.length){let b=a.lessonQueue[0];F(a,"tutor",b.text,"LESSON",{isQuestion:!0})}return a}let f=b?.trim();if(!f)return a;if(F(a,"user",f),"INTRO"===a.phase){if("awaiting_name"===a.introStep||"awaiting_spelling"===a.introStep){let b=o(f);if((0,d.M)("tutor.intro.capture",{transcript:f,introStep:a.introStep,obviousCandidate:b??null}),b)return a.pendingName=b,a.introAttempts=0,a.introStep="confirming_name",F(a,"tutor",`I heard ${b}. Is that right?`,"INTRO"),a;let c=await t(f,a.introStep,a.introAttempts);return"candidate"===c.mode&&c.candidate?(a.pendingName=c.candidate,a.introAttempts=0,a.introStep="confirming_name"):(a.introAttempts+=1,a.introStep="spell"===c.mode||a.introAttempts>=2?"awaiting_spelling":"awaiting_name"),F(a,"tutor",c.reply,"INTRO"),a}if("confirming_name"===a.introStep){let b=a.pendingName;if(!b)return a.introStep="awaiting_name",F(a,"tutor","Let's try that again. What's your name?","INTRO"),a;if(/^\s*(yes|yeah|yep|correct|right|that's right|that is right|yes that's right|yes that is right|yeah that's right|yeah that is right|yeah it is right|yes it is right|it is right)\s*[.!]?\s*$/i.test(f))return await G(a,b),a;if(/\b(no|nope|wrong|not exactly|that'?s not right|that is not right)\b/i.test(f)){let b=o(f);return b?(a.pendingName=b,a.introAttempts=0,F(a,"tutor",`I heard ${b}. Is that right?`,"INTRO")):(a.pendingName=void 0,a.introAttempts+=1,a.introStep=a.introAttempts>=2?"awaiting_spelling":"awaiting_name",F(a,"tutor","awaiting_spelling"===a.introStep?"I want to get it right. Can you spell your name for me, one letter at a time?":"Thanks for correcting me. Could you say your name again?","INTRO")),a}let c=await u(f,b,a.introAttempts);return"confirmed"===c.mode?await G(a,b):("candidate"===c.mode&&c.candidate?(a.pendingName=c.candidate,a.introAttempts=0):(a.pendingName=void 0,a.introAttempts+=1,a.introStep="spell"===c.mode||a.introAttempts>=2?"awaiting_spelling":"awaiting_name"),F(a,"tutor",c.reply,"INTRO")),a}}if("PLACEMENT"===a.phase){let b=a.placementQuestions[a.placementIndex];if(a.placementAnswers.push({questionId:b.id,question:b.question,answer:f,score:0}),a.placementIndex+=1,a.placementIndex<3){a.placementQuestions[a.placementIndex]||a.placementQuestions.push(await x(a.profile.name??"there",a.placementIndex+1,a.placementQuestions,a.placementAnswers));let b=a.placementQuestions[a.placementIndex];return F(a,"tutor",await y(a.profile.name??"there",a.placementIndex+1,b.question),"PLACEMENT"),a}return await H(a),a}if("LESSON"===a.phase){let b=a.lessonQueue??[],c=a.currentQueueIndex??0,d=b[c];if(/\b(repeat|say again|again|once more|pardon|say that again)\b/i.test(f)&&d)return F(a,"tutor",d.text,"LESSON",{isQuestion:!0}),a;let e=await E(a.profile.level??"Beginner",a.profile.name??"there",f,a.messages,a.lessonBundle,a.profile.learnerProfile,d?.text);F(a,"tutor",e,"LESSON");let g=c+1;b.length&&g<b.length?(a.currentQueueIndex=g,F(a,"tutor",b[g].text,"LESSON",{isQuestion:!0})):b.length&&(a.currentQueueIndex=b.length,F(a,"tutor","Great job. You have completed today's lesson prompts.","LESSON"))}return a}},6487:()=>{},7925:(a,b,c)=>{"use strict";c.d(b,{Ht:()=>f,ME:()=>g,ih:()=>e});let d=new Map;function e(a){return d.set(a.id,a),a}function f(a){return d.get(a)}function g(a){d.delete(a)}},8335:()=>{},9618:(a,b,c)=>{"use strict";function d(a){try{return JSON.stringify(a,null,2)}catch{return String(a)}}function e(a,b){let c=new Date().toISOString();if(void 0===b)return void console.log(`[tota-debug] ${c} ${a}`);console.log(`[tota-debug] ${c} ${a}
${d(b)}`)}function f(a,b,c){let e=new Date().toISOString(),f=b instanceof Error?b.message:String(b);if(void 0===c)return void console.error(`[tota-debug] ${e} ${a}: ${f}`);console.error(`[tota-debug] ${e} ${a}: ${f}
${d(c)}`)}c.d(b,{M:()=>e,v:()=>f})}};