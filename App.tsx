import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Trash2, FileText, Plus, Home, Clock, Award, CheckCircle, XCircle, ChevronLeft, Search, Filter, Lock, Unlock, Shuffle, KeyRound, User, AlertTriangle, LogIn, LogOut, Trophy } from 'lucide-react';
import { parseQuizContent, SAMPLE_DATA } from './utils/parser';
import { saveQuiz, getStoredQuizzes, deleteQuiz, saveQuizResult, getQuizResults } from './utils/storage';
import { Question, Quiz, QuizAttempt } from './types';
import { QuestionCard } from './components/QuestionCard';

type ViewState = 'dashboard' | 'create' | 'taking' | 'result';
type FilterType = 'newest' | 'oldest' | 'az' | 'za';

const App: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<ViewState>('dashboard');
  
  // Data State
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizResults, setQuizResults] = useState<QuizAttempt[]>([]); // Leaderboard data

  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);

  // Dashboard Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('newest');

  // Creation Form State
  const [inputTitle, setInputTitle] = useState("");
  const [inputDesc, setInputDesc] = useState("");
  const [inputText, setInputText] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [isShuffle, setIsShuffle] = useState(false);

  // User Session State
  const [candidateName, setCandidateName] = useState("");
  const [userAnswers, setUserAnswers] = useState<Record<number, Set<string>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // --- MODALS STATE ---
  
  // 1. Password Modal
  const [passwordModal, setPasswordModal] = useState<{ isOpen: boolean; quiz: Quiz | null; error: string }>({
    isOpen: false,
    quiz: null,
    error: ""
  });
  const [attemptPassword, setAttemptPassword] = useState("");

  // 2. Name Input Modal (Before starting)
  const [nameModal, setNameModal] = useState<{ isOpen: boolean; quiz: Quiz | null }>({
    isOpen: false,
    quiz: null
  });
  const [tempName, setTempName] = useState("");

  // 3. Submit Confirmation Modal
  const [submitModal, setSubmitModal] = useState({ isOpen: false });

  // 4. Admin Login Modal
  const [loginModal, setLoginModal] = useState({ isOpen: false, error: "" });
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // 5. Delete Confirmation Modal
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; quizId: string | null }>({ isOpen: false, quizId: null });

  // Initialize
  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = () => {
    setQuizzes(getStoredQuizzes());
  };

  // Utility: Shuffle Array (Fisher-Yates)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  // --- Filtering Logic ---
  const filteredQuizzes = useMemo(() => {
    let result = quizzes.filter(q => 
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (filterType) {
        case 'newest':
            result.sort((a, b) => b.createdAt - a.createdAt);
            break;
        case 'oldest':
            result.sort((a, b) => a.createdAt - b.createdAt);
            break;
        case 'az':
            result.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'za':
            result.sort((a, b) => b.title.localeCompare(a.title));
            break;
    }
    return result;
  }, [quizzes, searchQuery, filterType]);


  // --- Actions ---

  const handleStartCreate = () => {
    setInputTitle("");
    setInputDesc("");
    setInputText("");
    setInputPassword("");
    setIsShuffle(false);
    setView('create');
  };

  const handleLoadSample = () => {
    setInputText(SAMPLE_DATA);
    setInputTitle("Đề thi mẫu Javascript");
    setInputDesc("Bộ câu hỏi kiểm tra kiến thức Frontend cơ bản");
  };

  const handleSaveQuiz = () => {
    const questions = parseQuizContent(inputText);
    if (questions.length === 0) {
      alert("Vui lòng nhập nội dung câu hỏi hợp lệ!");
      return;
    }
    if (!inputTitle.trim()) {
        alert("Vui lòng nhập tên đề thi!");
        return;
    }

    const newQuiz: Quiz = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      title: inputTitle,
      description: inputDesc || "Không có mô tả",
      createdAt: Date.now(),
      questions: questions,
      password: inputPassword.trim(),
      shuffleQuestions: isShuffle
    };

    saveQuiz(newQuiz);
    loadQuizzes();
    setView('dashboard');
  };

  const handleRequestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Stop click from opening the quiz
    setDeleteModal({ isOpen: true, quizId: id });
  };

  const handleConfirmDelete = () => {
      if (deleteModal.quizId) {
          deleteQuiz(deleteModal.quizId);
          loadQuizzes();
          setDeleteModal({ isOpen: false, quizId: null });
      }
  };

  // Login Logic
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === "admin" && loginPass === "051802") {
        setIsAdmin(true);
        setLoginModal({ isOpen: false, error: "" });
        setLoginUser("");
        setLoginPass("");
    } else {
        setLoginModal(prev => ({ ...prev, error: "Sai tài khoản hoặc mật khẩu!" }));
    }
  };

  const handleLogout = () => {
      setIsAdmin(false);
  };

  // STEP 1: Click Quiz -> Check Password
  const handleQuizClick = (quiz: Quiz) => {
    if (quiz.password) {
        setAttemptPassword("");
        setPasswordModal({ isOpen: true, quiz, error: "" });
    } else {
        proceedToNameInput(quiz);
    }
  };

  // Verify password
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModal.quiz) return;

    if (attemptPassword === passwordModal.quiz.password) {
        const quizToStart = passwordModal.quiz;
        setPasswordModal({ isOpen: false, quiz: null, error: "" });
        proceedToNameInput(quizToStart);
    } else {
        setPasswordModal(prev => ({ ...prev, error: "Mật khẩu không đúng!" }));
    }
  };

  // STEP 2: Show Name Input
  const proceedToNameInput = (quiz: Quiz) => {
      setTempName("");
      setNameModal({ isOpen: true, quiz });
  };

  const handleNameSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!nameModal.quiz) return;
      if (!tempName.trim()) {
          alert("Vui lòng nhập tên của bạn!");
          return;
      }
      
      const quiz = nameModal.quiz;
      const name = tempName;
      setNameModal({ isOpen: false, quiz: null });
      startQuizSession(quiz, name);
  };

  // STEP 3: Actual logic to start the quiz
  const startQuizSession = (quiz: Quiz, name: string) => {
    const questionsToUse = quiz.shuffleQuestions 
        ? shuffleArray(quiz.questions) 
        : [...quiz.questions];
    
    const sessionQuiz = { ...quiz, questions: questionsToUse };
    
    setCandidateName(name);
    setActiveQuiz(sessionQuiz);
    setUserAnswers({});
    setIsSubmitted(false);
    setView('taking');
  };

  const toggleAnswer = (questionId: number, optionId: string) => {
    if (isSubmitted) return;

    setUserAnswers(prev => {
        const currentSet = new Set(prev[questionId] || []);
        if (currentSet.has(optionId)) {
            currentSet.delete(optionId);
        } else {
            currentSet.add(optionId);
        }
        return { ...prev, [questionId]: currentSet };
    });
  };

  // Trigger Submit Modal
  const handlePreSubmit = () => {
    setSubmitModal({ isOpen: true });
  };

  // Confirm Submit
  const handleConfirmSubmit = () => {
    setSubmitModal({ isOpen: false });
    
    // Calculate final stats
    const { score, correct, total } = calculateStats(activeQuiz, userAnswers);

    // Save result
    if (activeQuiz) {
        const result: QuizAttempt = {
            id: Date.now().toString(),
            quizId: activeQuiz.id,
            playerName: candidateName,
            score,
            correct,
            total,
            timestamp: Date.now()
        };
        saveQuizResult(result);
        // Load results for leaderboard immediately
        const results = getQuizResults(activeQuiz.id);
        setQuizResults(results);
    }

    setIsSubmitted(true);
    setView('result');
    window.scrollTo(0,0);
  };

  const goHome = () => {
    setView('dashboard');
    setActiveQuiz(null);
    setIsSubmitted(false);
    setUserAnswers({});
    setCandidateName("");
    setQuizResults([]);
  };

  const calculateStats = (quiz: Quiz | null, answers: Record<number, Set<string>>) => {
    if (!quiz) return { score: 0, correct: 0, total: 0, percentage: 0 };
    
    let correct = 0;
    quiz.questions.forEach(q => {
        const userSelected = answers[q.id] || new Set();
        const correctOptions = q.options.filter(o => o.isCorrect).map(o => o.id);
        
        // Check exact match
        const isExactMatch = 
            correctOptions.length === userSelected.size &&
            correctOptions.every(id => userSelected.has(id));
            
        if (isExactMatch) correct++;
    });
    
    const total = quiz.questions.length;
    return {
        correct,
        total,
        score: total === 0 ? 0 : Math.round((correct / total) * 100) / 10, // Keep 1 decimal if needed, usually scale 10
        percentage: total === 0 ? 0 : Math.round((correct / total) * 100)
    };
  };

  // Helper for renderResult (needed because state access differs in render vs handler)
  const currentStats = calculateStats(activeQuiz, userAnswers);

  // --- Views ---

  const renderDashboard = () => (
    <div className="animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Kho đề thi</h2>
                <p className="text-gray-500 mt-1">Tìm kiếm và ôn tập kiến thức</p>
            </div>
            <button 
                onClick={handleStartCreate}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium"
            >
                <Plus size={20} />
                Tạo đề mới
            </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm đề thi..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
            <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-500" />
                <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as FilterType)}
                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none"
                >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="az">Tên A-Z</option>
                    <option value="za">Tên Z-A</option>
                </select>
            </div>
        </div>

        {/* Quiz Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map(quiz => (
                <div 
                    key={quiz.id} 
                    onClick={() => handleQuizClick(quiz)}
                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group relative overflow-hidden"
                >
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                         {quiz.password && (
                            <span className="bg-amber-100 text-amber-700 p-1.5 rounded-md" title="Có mật khẩu">
                                <Lock size={14} />
                            </span>
                         )}
                         {quiz.shuffleQuestions && (
                            <span className="bg-purple-100 text-purple-700 p-1.5 rounded-md" title="Đảo câu hỏi">
                                <Shuffle size={14} />
                            </span>
                         )}
                    </div>

                    {/* Admin Delete Button */}
                    {isAdmin && (
                        <button 
                            onClick={(e) => handleRequestDelete(e, quiz.id)}
                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors z-10"
                            title="Xóa đề thi"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}

                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4 mt-6">
                        <FileText size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">{quiz.title}</h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">{quiz.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {new Date(quiz.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {quiz.questions.length} câu
                        </span>
                    </div>
                </div>
            ))}
            
            {filteredQuizzes.length === 0 && (
                <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="text-gray-300 mb-3 mx-auto w-16 h-16 flex items-center justify-center bg-gray-50 rounded-full">
                        <Search size={32} />
                    </div>
                    <p className="text-gray-500 font-medium">Không tìm thấy đề thi nào.</p>
                    {quizzes.length === 0 && (
                         <p className="text-gray-400 text-sm mt-1">Hãy bắt đầu bằng cách tạo đề mới!</p>
                    )}
                </div>
            )}
        </div>
    </div>
  );

  const renderCreate = () => (
    <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={goHome} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                <ChevronLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Soạn thảo đề thi</h2>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Tên đề thi <span className="text-red-500">*</span></label>
                    <input 
                        value={inputTitle}
                        onChange={(e) => setInputTitle(e.target.value)}
                        placeholder="Ví dụ: Kiểm tra 15 phút môn Toán"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Mô tả ngắn</label>
                    <input 
                        value={inputDesc}
                        onChange={(e) => setInputDesc(e.target.value)}
                        placeholder="Mô tả nội dung bài kiểm tra..."
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Advanced Settings */}
            <div className="grid md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Lock size={16} /> Mật khẩu (Tùy chọn)
                    </label>
                    <input 
                        type="text"
                        value={inputPassword}
                        onChange={(e) => setInputPassword(e.target.value)}
                        placeholder="Để trống nếu công khai"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="flex items-end pb-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none p-3 border border-gray-200 rounded-lg w-full hover:bg-gray-50 transition-colors">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isShuffle ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                            {isShuffle && <CheckCircle size={14} className="text-white" />}
                        </div>
                        <input 
                            type="checkbox" 
                            checked={isShuffle}
                            onChange={(e) => setIsShuffle(e.target.checked)}
                            className="hidden"
                        />
                        <span className="text-gray-700 font-medium flex items-center gap-2">
                            <Shuffle size={16} /> Đảo vị trí câu hỏi khi làm
                        </span>
                    </label>
                </div>
            </div>

            <div className="space-y-2 pt-2">
                <div className="flex justify-between items-end">
                     <label className="block text-sm font-medium text-gray-700">Nội dung câu hỏi</label>
                     <button onClick={handleLoadSample} className="text-xs text-blue-600 hover:underline font-medium">Chèn mẫu thử</button>
                </div>
                <div className="relative">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={`Câu 1: Nội dung câu hỏi?\nA. Đáp án A\n*B. Đáp án đúng\nC. Đáp án C`}
                        className="w-full h-[300px] p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/90 px-2 py-1 rounded border border-gray-100 shadow-sm">
                        Sử dụng dấu * trước đáp án đúng
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                    onClick={handleSaveQuiz}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 hover:-translate-y-0.5 transition-all"
                >
                    <FileText size={18} />
                    Lưu đề thi
                </button>
            </div>
        </div>
    </div>
  );

  const renderTaking = () => {
    if (!activeQuiz) return null;
    const answeredCount = Object.keys(userAnswers).length;
    const progress = activeQuiz.questions.length > 0 
        ? (answeredCount / activeQuiz.questions.length) * 100 
        : 0;

    return (
        <div className="animate-in slide-in-from-bottom-8 duration-500 max-w-3xl mx-auto pb-24 relative">
            {/* Sticky Header for Progress */}
            <div className="sticky top-16 bg-white/95 backdrop-blur z-40 py-4 border-b border-gray-200 mb-6 -mx-4 px-4 md:mx-0 md:px-0 md:rounded-b-xl">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex flex-col">
                        <h2 className="font-bold text-gray-800 truncate mr-4">{activeQuiz.title}</h2>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <User size={12} /> {candidateName}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="text-blue-600">{answeredCount}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-900">{activeQuiz.questions.length}</span>
                    </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="space-y-8">
                {activeQuiz.questions.map((q) => (
                    <QuestionCard 
                        key={q.id} 
                        question={q}
                        selectedOptions={userAnswers[q.id] || new Set()}
                        onToggle={(optionId) => toggleAnswer(q.id, optionId)}
                        isSubmitted={false}
                    />
                ))}
            </div>

            {/* Submit Button Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)]">
                 <div className="max-w-3xl mx-auto flex justify-center">
                    <button 
                        onClick={handlePreSubmit}
                        className="w-full md:w-auto md:min-w-[240px] bg-blue-600 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                    >
                        <Award size={20} />
                        Nộp bài & Xem kết quả
                    </button>
                 </div>
            </div>
        </div>
    );
  };

  const renderResult = () => {
    if (!activeQuiz) return null;
    const { score, correct, total, percentage } = currentStats;

    return (
        <div className="animate-in zoom-in duration-300 max-w-4xl mx-auto pt-8 pb-20">
            <div className="grid lg:grid-cols-3 gap-8">
                
                {/* Left Column: Score */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 md:p-12 relative overflow-hidden text-center mb-8">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 to-indigo-500" />
                        
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-50 mb-6 relative">
                            {score >= 8 ? (
                                <Award size={48} className="text-yellow-500" />
                            ) : (
                                <FileText size={48} className="text-blue-500" />
                            )}
                            <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm">
                                {score >= 5 ? <CheckCircle className="text-green-500" size={24} fill="white" /> : <XCircle className="text-red-500" size={24} fill="white" />}
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Kết quả làm bài</h2>
                        <div className="flex items-center justify-center gap-2 text-gray-500 mb-8">
                            <User size={16} />
                            <span className="font-medium">{candidateName}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="text-sm text-gray-500 mb-1">Điểm số</div>
                                <div className="text-2xl font-bold text-blue-600">{score}/10</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="text-sm text-gray-500 mb-1">Số câu đúng</div>
                                <div className="text-2xl font-bold text-green-600">{correct}/{total}</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="text-sm text-gray-500 mb-1">Tỉ lệ</div>
                                <div className="text-2xl font-bold text-indigo-600">{percentage}%</div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                                onClick={() => startQuizSession(activeQuiz, candidateName)} // Re-use start logic to reshuffle if needed
                                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Clock size={18} />
                                Làm lại đề này
                            </button>
                            <button 
                                onClick={goHome}
                                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Home size={18} />
                                Về danh sách
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Leaderboard */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-full">
                        <div className="bg-yellow-50 p-4 border-b border-yellow-100 flex items-center gap-2">
                            <Trophy className="text-yellow-600" size={20} />
                            <h3 className="font-bold text-gray-900">Bảng xếp hạng</h3>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {quizResults.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    Chưa có dữ liệu xếp hạng
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {quizResults.slice(0, 10).map((attempt, idx) => (
                                        <div key={idx} className={`flex items-center justify-between p-3 ${idx < 3 ? 'bg-yellow-50/30' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                    idx === 0 ? 'bg-yellow-400 text-white' : 
                                                    idx === 1 ? 'bg-gray-300 text-white' : 
                                                    idx === 2 ? 'bg-amber-600 text-white' : 
                                                    'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 text-sm line-clamp-1 w-24">{attempt.playerName}</div>
                                                    <div className="text-xs text-gray-400">
                                                        {new Date(attempt.timestamp).toLocaleDateString('vi-VN')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-blue-600">{attempt.score}</div>
                                                <div className="text-xs text-gray-400">{attempt.correct}/{attempt.total}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* Review Section */}
            <h3 className="text-xl font-bold text-gray-800 mb-6 px-2 mt-4">Chi tiết bài làm</h3>
            <div className="space-y-8">
                {activeQuiz.questions.map((q) => (
                    <QuestionCard 
                        key={q.id} 
                        question={q}
                        selectedOptions={userAnswers[q.id] || new Set()}
                        onToggle={() => {}} // Read only
                        isSubmitted={true}
                    />
                ))}
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-gray-900">
      {/* Navigation Bar */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={goHome}>
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                <BookOpen size={20} strokeWidth={2.5} />
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-gray-900 line-clamp-1">
              10 vạn câu hỏi vì sao của <span className="text-indigo-600">Ngan Ha</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
              {view !== 'dashboard' && (
                <button onClick={goHome} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors" title="Trang chủ">
                    <Home size={20} />
                </button>
              )}
              
              {isAdmin ? (
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                      <LogOut size={16} />
                      Thoát Admin
                  </button>
              ) : (
                  <button 
                    onClick={() => setLoginModal({ isOpen: true, error: "" })}
                    className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors"
                  >
                      <LogIn size={16} />
                      Đăng nhập
                  </button>
              )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {view === 'dashboard' && renderDashboard()}
        {view === 'create' && renderCreate()}
        {view === 'taking' && renderTaking()}
        {view === 'result' && renderResult()}
      </main>

      {/* Password Modal */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                        <KeyRound size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Yêu cầu mật khẩu</h3>
                    <p className="text-gray-500 mb-6 text-sm">
                        Đề thi <b>"{passwordModal.quiz?.title}"</b> được bảo mật. Vui lòng nhập mật khẩu để tiếp tục.
                    </p>
                    
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <input 
                            type="password" 
                            autoFocus
                            value={attemptPassword}
                            onChange={(e) => setAttemptPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-bold text-lg tracking-widest"
                            placeholder="******"
                        />
                        {passwordModal.error && (
                            <p className="text-red-500 text-sm font-medium">{passwordModal.error}</p>
                        )}
                        <div className="flex gap-3 mt-4">
                             <button 
                                type="button"
                                onClick={() => setPasswordModal({ isOpen: false, quiz: null, error: "" })}
                                className="flex-1 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                             >
                                Hủy
                             </button>
                             <button 
                                type="submit"
                                className="flex-1 py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                             >
                                Xác nhận
                             </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* Name Input Modal */}
      {nameModal.isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                            <User size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Thông tin thí sinh</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            Nhập tên của bạn để bắt đầu làm bài
                        </p>
                    </div>
                    
                    <form onSubmit={handleNameSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                            <input 
                                type="text" 
                                autoFocus
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Nguyễn Văn A..."
                            />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600 space-y-2">
                            <p><b>Đề thi:</b> {nameModal.quiz?.title}</p>
                            <p><b>Số câu hỏi:</b> {nameModal.quiz?.questions.length} câu</p>
                            <p><b>Thời gian:</b> Tự do</p>
                        </div>
                        <div className="flex gap-3 mt-4">
                             <button 
                                type="button"
                                onClick={() => setNameModal({ isOpen: false, quiz: null })}
                                className="flex-1 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                             >
                                Hủy
                             </button>
                             <button 
                                type="submit"
                                className="flex-1 py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                             >
                                Bắt đầu làm bài
                             </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {submitModal.isOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Nộp bài thi?</h3>
                    
                    <div className="my-4">
                         {activeQuiz && (activeQuiz.questions.length - Object.keys(userAnswers).length) > 0 ? (
                            <p className="text-gray-600">
                                Bạn còn <span className="text-red-500 font-bold">{activeQuiz.questions.length - Object.keys(userAnswers).length}</span> câu chưa trả lời.
                                <br/>Bạn có chắc chắn muốn nộp bài không?
                            </p>
                         ) : (
                            <p className="text-gray-600">
                                Bạn đã hoàn thành tất cả câu hỏi.
                                <br/>Xác nhận nộp bài và xem kết quả?
                            </p>
                         )}
                    </div>

                    <div className="flex gap-3 mt-6">
                         <button 
                            onClick={() => setSubmitModal({ isOpen: false })}
                            className="flex-1 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                         >
                            Làm tiếp
                         </button>
                         <button 
                            onClick={handleConfirmSubmit}
                            className="flex-1 py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                         >
                            Nộp ngay
                         </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {loginModal.isOpen && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Đăng nhập Admin</h3>
                    
                    <form onSubmit={handleLogin} className="space-y-3">
                        <input 
                            type="text" 
                            autoFocus
                            value={loginUser}
                            onChange={(e) => setLoginUser(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Tài khoản"
                        />
                        <input 
                            type="password" 
                            value={loginPass}
                            onChange={(e) => setLoginPass(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Mật khẩu"
                        />
                        {loginModal.error && (
                            <p className="text-red-500 text-xs font-medium text-center">{loginModal.error}</p>
                        )}
                        
                        <div className="pt-2">
                             <button 
                                type="submit"
                                className="w-full py-2 rounded-lg font-semibold bg-gray-900 text-white hover:bg-black transition-colors"
                             >
                                Đăng nhập
                             </button>
                             <button 
                                type="button"
                                onClick={() => setLoginModal({ isOpen: false, error: "" })}
                                className="w-full py-2 mt-2 text-xs text-gray-500 hover:text-gray-700"
                             >
                                Đóng
                             </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Xóa đề thi?</h3>
                    <p className="text-gray-500 text-sm mb-6">
                        Hành động này không thể hoàn tác. Đề thi sẽ bị xóa vĩnh viễn khỏi hệ thống.
                    </p>
                    
                    <div className="flex gap-3">
                         <button 
                            onClick={() => setDeleteModal({ isOpen: false, quizId: null })}
                            className="flex-1 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                         >
                            Hủy
                         </button>
                         <button 
                            onClick={handleConfirmDelete}
                            className="flex-1 py-3 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                         >
                            Xóa ngay
                         </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;