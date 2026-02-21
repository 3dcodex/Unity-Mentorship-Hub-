import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../src/firebase';
import { useAuth } from '../App';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
  location: string;
  summary: string;
  experiences: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    logoUrl?: string;
  }>;
  education: Array<{
    id: string;
    school: string;
    degree: string;
    field: string;
    graduationDate: string;
    gpa?: string;
  }>;
  skills: Array<{ name: string; level: 'Beginner' | 'Intermediate' | 'Expert' }>;
  certifications: Array<{
    id: string;
    title: string;
    issuer: string;
    date: string;
  }>;
  projects: Array<{
    id: string;
    title: string;
    description: string;
    technologies: string;
    links: string;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
  }>;
  hobbies: string[];
  references: Array<{ name: string; contact: string }>;
  languages: Array<{ name: string; proficiency: string }>;
  volunteer: Array<{
    id: string;
    organization: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  sectionVisibility: {
    summary: boolean;
    experiences: boolean;
    education: boolean;
    skills: boolean;
    certifications: boolean;
    projects: boolean;
    achievements: boolean;
    hobbies: boolean;
    references: boolean;
    languages: boolean;
    volunteer: boolean;
  };
}

const ResumeBuilder: React.FC = () => {
    // Auto-save toggle from ProfileSettings
    const [autoSave, setAutoSave] = useState(localStorage.getItem('unity_resume_auto_save') === 'true');
    React.useEffect(() => {
      const handler = () => setAutoSave(localStorage.getItem('unity_resume_auto_save') === 'true');
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }, []);
  const [undoStack, setUndoStack] = useState<ResumeData[]>([]);
  const [redoStack, setRedoStack] = useState<ResumeData[]>([]);
  const { user } = useAuth();
  const [language, setLanguage] = useState('en');
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [themeColor, setThemeColor] = useState('#1d4ed8');
  const [fontStyle, setFontStyle] = useState('sans-serif');
  const [fontSize, setFontSize] = useState(14);
  const [resumeData, setResumeData] = useState<ResumeData>({
    fullName: localStorage.getItem('unity_user_name') || '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    website: '',
    location: '',
    summary: '',
    experiences: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    achievements: [],
    hobbies: [],
    references: [],
    languages: [],
    volunteer: [],
    sectionVisibility: {
      summary: true,
      experiences: true,
      education: true,
      skills: true,
      certifications: true,
      projects: true,
      achievements: true,
      hobbies: true,
      references: true,
      languages: true,
      volunteer: true,
    },
  });
  // Local save always
  React.useEffect(() => {
    localStorage.setItem('unity_resume_data', JSON.stringify(resumeData));
  }, [resumeData]);

  // Auto-save to Firestore if enabled
  React.useEffect(() => {
    if (!autoSave || !user) return;
    const save = async () => {
      try {
        const resumeId = 'autosave';
        const basicInfo = {
          fullName: resumeData.fullName,
          email: resumeData.email,
          phone: resumeData.phone,
          links: {
            LinkedIn: resumeData.linkedin,
            GitHub: resumeData.github,
            Portfolio: resumeData.website,
          },
        };
        const templateSettings = {
          font: fontStyle,
          color: themeColor,
          layout: selectedTemplate,
        };
        await setDoc(
          doc(db, 'Users', user.uid, 'resumes', resumeId),
          {
            basicInfo,
            workExperience: resumeData.experiences,
            education: resumeData.education,
            skills: resumeData.skills,
            projects: resumeData.projects,
            awards: resumeData.achievements,
            languages: resumeData.languages,
            hobbies: resumeData.hobbies,
            templateSettings,
            lastEditedTimestamp: Timestamp.now(),
          },
          { merge: true }
        );
      } catch (err) {
        // Optionally handle error
      }
    };
    save();
  }, [resumeData, fontStyle, themeColor, selectedTemplate, user, autoSave]);
  const handleUndo = () => {
    if (undoStack.length > 0) {
      setRedoStack([resumeData, ...redoStack]);
      setResumeData(undoStack[0]);
      setUndoStack(undoStack.slice(1));
    }
  };
  const handleRedo = () => {
    if (redoStack.length > 0) {
      setUndoStack([resumeData, ...undoStack]);
      setResumeData(redoStack[0]);
      setRedoStack(redoStack.slice(1));
    }
  };
  const languageOptions = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' },
    { code: 'zh', label: '中文' },
    { code: 'hi', label: 'हिन्दी' },
  ];
  const navigate = useNavigate();
  const resumePreviewRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleInputChange = (field: keyof ResumeData, value: any) => {
    setResumeData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addExperience = () => {
    const newId = Date.now().toString();
    setResumeData(prev => ({
      ...prev,
      experiences: [...prev.experiences, { id: newId, company: '', position: '', startDate: '', endDate: '', description: '' }],
    }));
  };

  const updateExperience = (id: string, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      experiences: prev.experiences.map(exp => exp.id === id ? { ...exp, [field]: value } : exp),
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experiences: prev.experiences.filter(exp => exp.id !== id),
    }));
  };

  const addEducation = () => {
    const newId = Date.now().toString();
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { id: newId, school: '', degree: '', field: '', graduationDate: '' }],
    }));
  };

  const updateEducation = (id: string, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu),
    }));
  };

  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id),
    }));
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !resumeData.skills.includes(skill.trim())) {
      setResumeData(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()],
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };

  const handleSaveResume = async () => {
    if (!user) {
      alert('Please log in to save your resume');
      return;
    }
    setIsSaving(true);
    try {
      // Generate a new resumeId
      const resumeId = Date.now().toString();
      // Prepare Firestore structure
      const basicInfo = {
        fullName: resumeData.fullName,
        email: resumeData.email,
        phone: resumeData.phone,
        links: {
          LinkedIn: resumeData.linkedin,
          GitHub: resumeData.github,
          Portfolio: resumeData.website,
        },
      };
      const templateSettings = {
        font: fontStyle,
        color: themeColor,
        layout: selectedTemplate,
      };
      await setDoc(
        doc(db, 'Users', user.uid, 'resumes', resumeId),
        {
          basicInfo,
          workExperience: resumeData.experiences,
          education: resumeData.education,
          skills: resumeData.skills,
          projects: resumeData.projects,
          awards: resumeData.achievements,
          languages: resumeData.languages,
          hobbies: resumeData.hobbies,
          templateSettings,
          lastEditedTimestamp: Timestamp.now(),
        }
      );
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      alert('Failed to save resume');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPDF = async () => {
    if (!resumePreviewRef.current) return;
    setIsDownloading(true);
    try {
      // Capture the resume preview as an image
      const canvas = await html2canvas(resumePreviewRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      // Calculate image dimensions to fit page
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
      pdf.save(`${resumeData.fullName || 'Resume'}.pdf`);
    } catch (err) {
      alert('Failed to download resume as PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const generateResumeText = (): string => {
    let text = `${resumeData.fullName}\n`;
    text += `${resumeData.email} | ${resumeData.phone} | ${resumeData.location}\n`;
    text += `LinkedIn: ${resumeData.linkedin}\n\n`;
    
    if (resumeData.summary) {
      text += `PROFESSIONAL SUMMARY\n${resumeData.summary}\n\n`;
    }

    if (resumeData.experiences.length > 0) {
      text += `EXPERIENCE\n`;
      resumeData.experiences.forEach(exp => {
        text += `${exp.position} at ${exp.company}\n${exp.startDate} - ${exp.endDate}\n${exp.description}\n\n`;
      });
    }

    if (resumeData.education.length > 0) {
      text += `EDUCATION\n`;
      resumeData.education.forEach(edu => {
        text += `${edu.degree} in ${edu.field}\n${edu.school} (${edu.graduationDate})\n\n`;
      });
    }

    if (resumeData.skills.length > 0) {
      text += `SKILLS\n${resumeData.skills.join(', ')}\n`;
    }

    return text;
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 md:py-12 px-4 sm:px-6 animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
      {/* Template & Design Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
              <div>
                <label className="font-bold text-xs">Language</label>
                <select value={language} onChange={e => setLanguage(e.target.value)} className="ml-2 p-2 rounded-xl border">
                  {languageOptions.map(opt => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))}
                </select>
              </div>
        <div>
          <label className="font-bold text-xs">Template</label>
          <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} className="ml-2 p-2 rounded-xl border">
            <option value="classic">Classic</option>
            <option value="modern">Modern</option>
            <option value="minimal">Minimal</option>
            <option value="creative">Creative</option>
          </select>
        </div>
        <div>
          <label className="font-bold text-xs">Theme Color</label>
          <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)} className="ml-2 w-8 h-8 border rounded-full" />
        </div>
        <div>
          <label className="font-bold text-xs">Font Style</label>
          <select value={fontStyle} onChange={e => setFontStyle(e.target.value)} className="ml-2 p-2 rounded-xl border">
            <option value="sans-serif">Sans-serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
          </select>
        </div>
        <div>
          <label className="font-bold text-xs">Font Size</label>
          <input type="number" min={10} max={24} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="ml-2 w-16 p-2 rounded-xl border" />
        </div>
        <div>
          <label className="font-bold text-xs">Section Visibility</label>
          <div className="flex flex-wrap gap-2 ml-2">
            {Object.keys(resumeData.sectionVisibility).map(section => (
              <label key={section} className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={resumeData.sectionVisibility[section]}
                  onChange={e => setResumeData(prev => ({
                    ...prev,
                    sectionVisibility: {
                      ...prev.sectionVisibility,
                      [section]: e.target.checked,
                    },
                  }))}
                />
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </label>
            ))}
          </div>
        </div>
      </div>
      {showSuccessMessage && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <span className="material-symbols-outlined text-green-600">check_circle</span>
          <p className="text-sm font-bold text-green-600">Resume saved successfully!</p>
        </div>
      )}

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">AI Resume Builder</h1>
          <p className="text-sm sm:text-base text-gray-500 font-medium mt-1">Create, preview, and download your professional resume.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                    <button 
                      onClick={handleUndo}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-700 font-black rounded-xl shadow-lg hover:scale-105 transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">undo</span>
                      Undo
                    </button>
                    <button 
                      onClick={handleRedo}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-700 font-black rounded-xl shadow-lg hover:scale-105 transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">redo</span>
                      Redo
                    </button>
          <button 
            onClick={() => navigate('/career')} 
            className="px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={downloadPDF}
            disabled={isDownloading}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-secondary text-white font-black rounded-xl shadow-lg shadow-secondary/20 hover:scale-105 transition-all disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </button>
          <button 
            onClick={() => alert('DOCX export coming soon!')}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-secondary text-white font-black rounded-xl shadow-lg shadow-secondary/20 hover:scale-105 transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">description</span>
            Export DOCX
          </button>
          <button 
            onClick={() => alert('Shareable link coming soon!')}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-secondary text-white font-black rounded-xl shadow-lg shadow-secondary/20 hover:scale-105 transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">link</span>
            Share Link
          </button>
          <button 
            onClick={handleSaveResume}
            disabled={isSaving}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            {isSaving ? 'Saving...' : 'Save Resume'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[80vh]">
          <div className="flex items-center gap-3 sticky top-0 bg-white z-10 pb-4">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`flex-1 h-2 rounded-full transition-all ${s <= step ? 'bg-primary' : 'bg-gray-100'}`}></div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <h2 className="text-lg sm:text-xl font-black">Personal Information</h2>
              <Input 
                label="Full Name" 
                placeholder="Alex Johnson" 
                value={resumeData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input 
                  label="Email" 
                  placeholder="alex@university.edu"
                  value={resumeData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
                <Input 
                  label="Phone" 
                  placeholder="+1 (555) 123-4567"
                  value={resumeData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <Input 
                label="LinkedIn URL" 
                placeholder="linkedin.com/in/alexjohnson"
                value={resumeData.linkedin}
                onChange={(e) => handleInputChange('linkedin', e.target.value)}
              />
              <Input 
                label="Location" 
                placeholder="Toronto, ON, Canada"
                value={resumeData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
              <TextArea 
                label="Professional Summary" 
                placeholder="Brief overview of your professional background and goals..."
                value={resumeData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
              />
              <div className="pt-4 flex justify-between">
                <button disabled className="text-gray-400">Back</button>
                <button 
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-primary text-white font-black rounded-xl hover:scale-105 transition-all"
                >
                  Next: Experience
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <h2 className="text-lg sm:text-xl font-black">Work Experience</h2>
              {resumeData.experiences.map((exp, idx) => (
                <ExperienceCard 
                  key={exp.id}
                  experience={exp}
                  onUpdate={(field, value) => updateExperience(exp.id, field, value)}
                  onRemove={() => removeExperience(exp.id)}
                />
              ))}
              <button 
                onClick={addExperience}
                className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary/20 transition-all flex items-center justify-center gap-2 text-primary font-bold"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Add Experience
              </button>
              <div className="pt-4 flex justify-between">
                <button 
                  onClick={() => setStep(1)}
                  className="text-gray-400"
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-primary text-white font-black rounded-xl hover:scale-105 transition-all"
                >
                  Next: Education
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <h2 className="text-lg sm:text-xl font-black">Education</h2>
              {resumeData.education.map((edu) => (
                <EducationCard 
                  key={edu.id}
                  education={edu}
                  onUpdate={(field, value) => updateEducation(edu.id, field, value)}
                  onRemove={() => removeEducation(edu.id)}
                />
              ))}
              <button 
                onClick={addEducation}
                className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary/20 transition-all flex items-center justify-center gap-2 text-primary font-bold"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Add Education
              </button>
              <div className="pt-4 flex justify-between">
                <button 
                  onClick={() => setStep(2)}
                  className="text-gray-400"
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 bg-primary text-white font-black rounded-xl hover:scale-105 transition-all"
                >
                  Next: Skills
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in slide-in-from-right-4">
              <h2 className="text-lg sm:text-xl font-black">Skills &amp; Certifications</h2>
              
              <div>
                <label className="text-xs sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Add Skills (comma-separated)</label>
                <SkillInput onAddSkill={addSkill} />
              </div>

              <div className="flex flex-wrap gap-2">
                {resumeData.skills.map(skill => (
                  <div key={skill} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold">
                    {skill}
                    <button 
                      onClick={() => removeSkill(skill)}
                      className="hover:scale-110 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-between">
                <button 
                  onClick={() => setStep(3)}
                  className="text-gray-400"
                >
                  Back
                </button>
                <button 
                 onClick={() => {
                    handleSaveResume();
                    setStep(1);
                  }}
                  className="px-6 py-2.5 bg-primary text-white font-black rounded-xl hover:scale-105 transition-all"
                >
                  Complete &amp; Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview */}
        <div className="sticky top-20 h-[80vh] overflow-hidden">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Live Preview</h3>
          <div 
            ref={resumePreviewRef}
            className="bg-white shadow-2xl rounded-lg p-8 h-full overflow-hidden flex flex-col space-y-4 border border-gray-200"
            style={{ scale: '0.9', transformOrigin: 'top center' }}
          >
            <div className="border-b-4 border-primary pb-4">
              <h1 className="text-2xl font-black text-gray-900">{resumeData.fullName || 'Your Name'}</h1>
              <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-2">
                {resumeData.email && <span>{resumeData.email}</span>}
                {resumeData.phone && <span>{resumeData.phone}</span>}
                {resumeData.location && <span>{resumeData.location}</span>}
              </div>
            </div>

            {resumeData.summary && (
              <div>
                <h2 className="text-xs font-black text-primary uppercase tracking-widest mb-2">Professional Summary</h2>
                <p className="text-xs text-gray-700 leading-relaxed">{resumeData.summary}</p>
              </div>
            )}

            {resumeData.experiences.length > 0 && (
              <div>
                <h2 className="text-xs font-black text-primary uppercase tracking-widest mb-2">Experience</h2>
                {resumeData.experiences.map(exp => (
                  <div key={exp.id} className="mb-2 text-xs">
                    <div className="font-black text-gray-900">{exp.position} at {exp.company}</div>
                    <div className="text-gray-600">{exp.startDate} - {exp.endDate}</div>
                    <div className="text-gray-700 text-xs mt-1">{exp.description}</div>
                  </div>
                ))}
              </div>
            )}

            {resumeData.education.length > 0 && (
              <div>
                <h2 className="text-xs font-black text-primary uppercase tracking-widest mb-2">Education</h2>
                {resumeData.education.map(edu => (
                  <div key={edu.id} className="text-xs mb-2">
                    <div className="font-black text-gray-900">{edu.degree} in {edu.field}</div>
                    <div className="text-gray-600">{edu.school} - {edu.graduationDate}</div>
                  </div>
                ))}
              </div>
            )}

            {resumeData.skills.length > 0 && (
              <div>
                <h2 className="text-xs font-black text-primary uppercase tracking-widest mb-2">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills.map(skill => (
                    <span key={skill} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Input: React.FC<{ label: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ label, placeholder, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-xs sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <input 
      type="text" 
      placeholder={placeholder} 
      value={value}
      onChange={onChange}
      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
    />
  </div>
);

const TextArea: React.FC<{ label: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }> = ({ label, placeholder, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-xs sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    <textarea 
      placeholder={placeholder} 
      value={value}
      onChange={onChange}
      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all resize-none h-20"
    />
  </div>
);

const ExperienceCard: React.FC<{ experience: any; onUpdate: (field: string, value: string) => void; onRemove: () => void }> = ({ experience, onUpdate, onRemove }) => (
  <div className="p-4 bg-gray-50 rounded-xl space-y-3">
    <div className="flex justify-between items-start">
      <div className="flex-1 space-y-2">
        <Input 
          label="Position" 
          placeholder="Software Engineer" 
          value={experience.position}
          onChange={(e) => onUpdate('position', e.target.value)}
        />
        <Input 
          label="Company" 
          placeholder="Tech Company Inc." 
          value={experience.company}
          onChange={(e) => onUpdate('company', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input 
            label="Start Date" 
            placeholder="Jan 2023" 
            value={experience.startDate}
            onChange={(e) => onUpdate('startDate', e.target.value)}
          />
          <Input 
            label="End Date" 
            placeholder="Present" 
            value={experience.endDate}
            onChange={(e) => onUpdate('endDate', e.target.value)}
          />
        </div>
        <TextArea 
          label="Description" 
          placeholder="Describe your responsibilities and achievements..." 
          value={experience.description}
          onChange={(e) => onUpdate('description', e.target.value)}
        />
      </div>
      <button 
        onClick={onRemove}
        className="text-red-500 hover:text-red-700 mt-2"
      >
        ✕
      </button>
    </div>
  </div>
);

const EducationCard: React.FC<{ education: any; onUpdate: (field: string, value: string) => void; onRemove: () => void }> = ({ education, onUpdate, onRemove }) => (
  <div className="p-4 bg-gray-50 rounded-xl space-y-3">
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1 space-y-2">
        <Input 
          label="School/University" 
          placeholder="University of Toronto" 
          value={education.school}
          onChange={(e) => onUpdate('school', e.target.value)}
        />
        <Input 
          label="Degree" 
          placeholder="Bachelor of Science" 
          value={education.degree}
          onChange={(e) => onUpdate('degree', e.target.value)}
        />
        <Input 
          label="Field of Study" 
          placeholder="Computer Science" 
          value={education.field}
          onChange={(e) => onUpdate('field', e.target.value)}
        />
        <Input 
          label="Graduation Date" 
          placeholder="May 2024" 
          value={education.graduationDate}
          onChange={(e) => onUpdate('graduationDate', e.target.value)}
        />
      </div>
      <button 
        onClick={onRemove}
        className="text-red-500 hover:text-red-700 mt-2"
      >
        ✕
      </button>
    </div>
  </div>
);

const SkillInput: React.FC<{ onAddSkill: (skill: string) => void }> = ({ onAddSkill }) => {
  const [input, setInput] = useState('');
  return (
    <div className="flex gap-2">
      <input 
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && input.trim()) {
            onAddSkill(input);
            setInput('');
          }
        }}
        placeholder="Type skill and press Enter"
        className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
      />
      <button 
        onClick={() => {
          if (input.trim()) {
            onAddSkill(input);
            setInput('');
          }
        }}
        className="px-4 py-3 bg-primary text-white font-black rounded-xl hover:scale-105 transition-all"
      >
        Add
      </button>
    </div>
  );
};

export default ResumeBuilder;
