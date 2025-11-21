import React from 'react';
import { Check, X } from 'lucide-react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  selectedOptions: Set<string>;
  onToggle: (optionId: string) => void;
  isSubmitted: boolean;
  mode: 'exam' | 'practice';
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  selectedOptions, 
  onToggle, 
  isSubmitted,
  mode
}) => {
  
  // Styling helpers
  const getOptionStyles = (optionId: string, isCorrect: boolean) => {
    const isSelected = selectedOptions.has(optionId);
    
    // TRƯỜNG HỢP 1: Chưa hiện kết quả
    // - Chưa nộp bài (Exam)
    // - Hoặc chế độ Practice nhưng chưa chọn đáp án này (để tránh lộ đáp án khác)
    if (!isSubmitted && !(mode === 'practice' && isSelected)) {
      return isSelected 
        ? "bg-blue-50 border-blue-500 shadow-sm" 
        : "bg-white border-gray-200 hover:bg-gray-50";
    }

    // TRƯỜNG HỢP 2: Hiện kết quả (Đã nộp bài HOẶC Practice mode & đã chọn đáp án này)
    if (isCorrect) {
      if (isSelected) {
        return "bg-green-100 border-green-500 ring-1 ring-green-500"; // Chọn đúng
      } else {
        // Đáp án đúng nhưng chưa chọn
        // FIX: Chỉ hiện gợi ý (nét đứt) khi ĐÃ NỘP BÀI. 
        // Trong chế độ Practice, nếu chưa chọn thì vẫn giấu đi.
        if (isSubmitted) {
            return "bg-white border-green-400 border-dashed ring-1 ring-green-200 opacity-75"; 
        }
        return "bg-white border-gray-200 hover:bg-gray-50"; // Practice: Giấu đáp án đúng chưa chọn
      }
    } else {
      if (isSelected) {
        return "bg-red-100 border-red-500"; // Chọn sai
      } else {
        return "bg-gray-50 border-gray-200 opacity-50"; // Đáp án sai khác (làm mờ)
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 text-lg leading-relaxed">
          <span className="text-blue-600 font-bold mr-2">Câu {question.id}:</span>
          {question.text}
        </h3>
      </div>

      {/* Options */}
      <div className="p-6 space-y-3">
        {question.options.map((option) => {
          const isSelected = selectedOptions.has(option.id);
          
          // Logic hiển thị icon kết quả:
          // 1. Đã nộp bài -> Hiện tất cả
          // 2. Practice -> Chỉ hiện icon cho dòng ĐANG chọn
          const showFeedback = isSubmitted || (mode === 'practice' && isSelected);

          return (
            <div
              key={option.id}
              onClick={() => !isSubmitted && onToggle(option.id)}
              className={`
                relative group flex items-start p-4 rounded-lg border-2 transition-all duration-200 select-none
                ${!isSubmitted ? 'cursor-pointer' : ''}
                ${getOptionStyles(option.id, option.isCorrect)}
              `}
            >
              {/* Checkbox UI */}
              <div className={`
                flex-shrink-0 mt-0.5 w-6 h-6 rounded border flex items-center justify-center mr-4 transition-colors
                ${
                  isSelected 
                    ? (showFeedback 
                        ? (option.isCorrect ? "bg-green-500 border-green-500" : "bg-red-500 border-red-500")
                        : "bg-blue-500 border-blue-500")
                    : "border-gray-300 bg-white"
                }
              `}>
                {isSelected && <Check size={16} className="text-white" strokeWidth={3} />}
              </div>

              <div className="flex-1">
                <span className="font-semibold mr-2 text-gray-900">{option.id}.</span>
                <span className="text-gray-700">{option.text}</span>
              </div>

              {/* Result Icons & Text */}
              {showFeedback && (
                <div className="ml-3 animate-in fade-in duration-300 flex flex-col items-end justify-center">
                  {/* Icon Tick/X cho lựa chọn của người dùng */}
                  {option.isCorrect && isSelected && <Check className="text-green-600" size={20} />}
                  {!option.isCorrect && isSelected && <X className="text-red-500" size={20} />}
                  
                  {/* Chữ 'Đáp án đúng' cho câu đúng bị bỏ qua */}
                  {/* FIX: Chỉ hiện khi ĐÃ NỘP BÀI */}
                  {option.isCorrect && !isSelected && isSubmitted && (
                      <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded whitespace-nowrap">Đáp án đúng</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};