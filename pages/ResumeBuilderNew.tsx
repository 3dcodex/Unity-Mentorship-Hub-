import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
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
  }>;
  education: Array<{
    id: string;
    school: string;
    degree: string;
    field: string;
    graduationDate: string;
    gpa?: string;
  }>;
  skills: string[];
  projects: Array<{
    id: string;
    title: string;
    description: string;
    technologies: string;
  }>;
}

const ResumeBuilderNew: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const resumePreviewRef = useRef<HTMLDivElement>(null);
  const [autoSave] = useState(localStorage.getItem('unity_resume_auto_save') === 'true');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [themeColor, setThemeColor] = useState('#6366f1');
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
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
    projects: [],
  });

  React.useEffect(() => {
    const loadResume = async () => {
      if (!user) return;
      try {
        const resumeDoc = await getDoc(doc(db, 'users', user.uid, 'resumes', 'autosave'));
        if (resumeDoc.exists()) {
          const data = resumeDoc.data();
          setResumeData({
            fullName: data.basicInfo?.fullName || '',
            email: data.basicInfo?.email || '',
            phone: data.basicInfo?.phone || '',
            linkedin: data.basicInfo?.links?.LinkedIn || '',
            github: data.basicInfo?.links?.GitHub || '',
            website: data.basicInfo?.links?.Portfolio || '',
            location: data.location || '',
            summary: data.summary || '',
            experiences: data.workExperience || [],
            education: data.education || [],
            skills: data.skills || [],
            projects: data.projects || [],
          });
          if (data.templateSettings) {
            setThemeColor(data.templateSettings.color || '#6366f1');
            setSelectedTemplate(data.templateSettings.layout || 'modern');
          }
        }
      } catch (err) {
        console.error('Error loading resume:', err);
      }
    };
    loadResume();
  }, [user]);

  React.useEffect(() => {
    if (!autoSave || !user) return;
    const save = async () => {
      try {
        await setDoc(
          doc(db, 'users', user.uid, 'resumes', 'autosave'),
          {
            basicInfo: {
              fullName: resumeData.fullName,
              email: resumeData.email,
              phone: resumeData.phone,
              links: {
                LinkedIn: resumeData.linkedin,
                GitHub: resumeData.github,
                Portfolio: resumeData.website,
              },
            },
            location: resumeData.location,
            summary: resumeData.summary,
            workExperience: resumeData.experiences,
            education: resumeData.education,
            skills: resumeData.skills,
            projects: resumeData.projects,
            templateSettings: {
              color: themeColor,
              layout: selectedTemplate,
            },
            lastEditedTimestamp: Timestamp.now(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Auto-save error:', err);
      }
    };
    save();
  }, [resumeData, themeColor, selectedTemplate, user, autoSave]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'resumes', Date.now().toString()),
        {
          basicInfo: {
            fullName: resumeData.fullName,
            email: resumeData.email,
            phone: resumeData.phone,
            links: {
              LinkedIn: resumeData.linkedin,
              GitHub: resumeData.github,
              Portfolio: resumeData.website,
            },
          },
          location: resumeData.location,
          summary: resumeData.summary,
          workExperience: resumeData.experiences,
          education: resumeData.education,
          skills: resumeData.skills,
          projects: resumeData.projects,
          templateSettings: {
            color: themeColor,
            layout: selectedTemplate,
          },
          lastEditedTimestamp: Timestamp.now(),
        }
      );
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
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
      const canvas = await html2canvas(resumePreviewRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
      pdf.save(`${resumeData.fullName || 'Resume'}.pdf`);
    } catch (err) {
      alert('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experiences: [...prev.experiences, { id: Date.now().toString(), company: '', position: '', startDate: '', endDate: '', description: '' }],
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
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { id: Date.now().toString(), school: '', degree: '', field: '', graduationDate: '' }],
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Floating Action Bar */}
      <div className="fixed top-20 right-8 z-50 flex flex-col gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="group relative bg-white hover:bg-indigo-600 text-gray-700 hover:text-white p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50"
          title="Save Resume"
        >
          <span className="material-symbols-outlined">{isSaving ? 'progress_activity' : 'save'}</span>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Save Resume
          </span>
        </button>
        <button
          onClick={downloadPDF}
          disabled={isDownloading}
          className="group relative bg-white hover:bg-green-600 text-gray-700 hover:text-white p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50"
          title="Download PDF"
        >
          <span className="material-symbols-outlined">{isDownloading ? 'progress_activity' : 'download'}</span>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Download PDF
          </span>
        </button>
        <button
          onClick={() => navigate('/career')}
          className="group relative bg-white hover:bg-red-600 text-gray-700 hover:text-white p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
          title="Close"
        >
          <span className="material-symbols-outlined">close</span>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Close
          </span>
        </button>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-bold">Resume saved successfully!</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            AI Resume Builder
          </h1>
          <p className="text-gray-600 text-lg">Create your professional resume in minutes</p>
        </div>

        {/* Template & Color Selector */}
        <div className="mb-8 bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-indigo-600">palette</span>
              <span className="font-bold text-sm text-gray-700">Theme Color:</span>
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-12 h-12 rounded-xl cursor-pointer border-2 border-gray-200"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-indigo-600">dashboard</span>
              <span className="font-bold text-sm text-gray-700">Template:</span>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="modern">Modern</option>
                <option value="classic">Classic</option>
                <option value="minimal">Minimal</option>
                <option value="creative">Creative</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Panel */}
          <div className="space-y-6">
            {/* Personal Info Card */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 rounded-2xl">
                  <span className="material-symbols-outlined text-indigo-600">person</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900">Personal Info</h2>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={resumeData.fullName}
                  onChange={(e) => setResumeData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="email"
                    placeholder="Email"
                    value={resumeData.email}
                    onChange={(e) => setResumeData(prev => ({ ...prev, email: e.target.value }))}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={resumeData.phone}
                    onChange={(e) => setResumeData(prev => ({ ...prev, phone: e.target.value }))}
                    className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Location"
                  value={resumeData.location}
                  onChange={(e) => setResumeData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                />
                <textarea
                  placeholder="Professional Summary"
                  value={resumeData.summary}
                  onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none h-24"
                />
              </div>
            </div>

            {/* Experience Card */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-2xl">
                    <span className="material-symbols-outlined text-purple-600">work</span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Experience</h2>
                </div>
                <button
                  onClick={addExperience}
                  className="p-2 bg-purple-100 hover:bg-purple-600 text-purple-600 hover:text-white rounded-xl transition-all"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              <div className="space-y-4">
                {resumeData.experiences.map((exp) => (
                  <div key={exp.id} className="p-4 bg-gray-50 rounded-2xl space-y-3 relative group">
                    <button
                      onClick={() => removeExperience(exp.id)}
                      className="absolute top-4 right-4 p-1 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                    <input
                      type="text"
                      placeholder="Position"
                      value={exp.position}
                      onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                    <input
                      type="text"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Start Date"
                        value={exp.startDate}
                        onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      />
                      <input
                        type="text"
                        placeholder="End Date"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      />
                    </div>
                    <textarea
                      placeholder="Description"
                      value={exp.description}
                      onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none h-20"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Education Card */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-2xl">
                    <span className="material-symbols-outlined text-green-600">school</span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Education</h2>
                </div>
                <button
                  onClick={addEducation}
                  className="p-2 bg-green-100 hover:bg-green-600 text-green-600 hover:text-white rounded-xl transition-all"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
              <div className="space-y-4">
                {resumeData.education.map((edu) => (
                  <div key={edu.id} className="p-4 bg-gray-50 rounded-2xl space-y-3 relative group">
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="absolute top-4 right-4 p-1 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                    <input
                      type="text"
                      placeholder="School/University"
                      value={edu.school}
                      onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    />
                    <input
                      type="text"
                      placeholder="Degree"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Field of Study"
                        value={edu.field}
                        onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      />
                      <input
                        type="text"
                        placeholder="Graduation Date"
                        value={edu.graduationDate}
                        onChange={(e) => updateEducation(edu.id, 'graduationDate', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Card */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-100 rounded-2xl">
                  <span className="material-symbols-outlined text-orange-600">star</span>
                </div>
                <h2 className="text-2xl font-black text-gray-900">Skills</h2>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a skill and press Enter"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addSkill(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {resumeData.skills.map((skill) => (
                    <div
                      key={skill}
                      className="group flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full font-bold text-sm"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-indigo-600">visibility</span>
                <h3 className="text-xl font-black text-gray-900">Live Preview</h3>
              </div>
              <div
                ref={resumePreviewRef}
                className="bg-white shadow-xl rounded-2xl p-8 border-2 border-gray-100 min-h-[600px]"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {/* Header */}
                <div className="border-b-4 pb-6 mb-6" style={{ borderColor: themeColor }}>
                  <h1 className="text-3xl font-black text-gray-900 mb-2">{resumeData.fullName || 'Your Name'}</h1>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    {resumeData.email && <span>{resumeData.email}</span>}
                    {resumeData.phone && <span>•</span>}
                    {resumeData.phone && <span>{resumeData.phone}</span>}
                    {resumeData.location && <span>•</span>}
                    {resumeData.location && <span>{resumeData.location}</span>}
                  </div>
                </div>

                {/* Summary */}
                {resumeData.summary && (
                  <div className="mb-6">
                    <h2 className="text-sm font-black uppercase tracking-wider mb-3" style={{ color: themeColor }}>
                      Professional Summary
                    </h2>
                    <p className="text-sm text-gray-700 leading-relaxed">{resumeData.summary}</p>
                  </div>
                )}

                {/* Experience */}
                {resumeData.experiences.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-black uppercase tracking-wider mb-3" style={{ color: themeColor }}>
                      Experience
                    </h2>
                    {resumeData.experiences.map((exp) => (
                      <div key={exp.id} className="mb-4">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-black text-gray-900">{exp.position}</h3>
                          <span className="text-xs text-gray-500">{exp.startDate} - {exp.endDate}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{exp.company}</p>
                        <p className="text-sm text-gray-700">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Education */}
                {resumeData.education.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-sm font-black uppercase tracking-wider mb-3" style={{ color: themeColor }}>
                      Education
                    </h2>
                    {resumeData.education.map((edu) => (
                      <div key={edu.id} className="mb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-black text-gray-900">{edu.degree} in {edu.field}</h3>
                            <p className="text-sm text-gray-600">{edu.school}</p>
                          </div>
                          <span className="text-xs text-gray-500">{edu.graduationDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Skills */}
                {resumeData.skills.length > 0 && (
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider mb-3" style={{ color: themeColor }}>
                      Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {resumeData.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                        >
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
      </div>
    </div>
  );
};

export default ResumeBuilderNew;
