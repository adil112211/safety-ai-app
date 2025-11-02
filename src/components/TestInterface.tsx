import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Award, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Question, Course } from '../lib/supabase';

interface TestInterfaceProps {
  course: Course;
  onComplete: () => void;
  onBack: () => void;
}

export function TestInterface({ course, onComplete, onBack }: TestInterfaceProps) {
  const { user, updateUserPoints } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
    pointsEarned: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, [course.id]);

  async function loadQuestions() {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('course_id', course.id)
        .limit(10);

      if (error) throw error;

      if (!data || data.length === 0) {
        const demoQuestions = generateDemoQuestions(course.id);
        setQuestions(demoQuestions);
      } else {
        setQuestions(data);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      const demoQuestions = generateDemoQuestions(course.id);
      setQuestions(demoQuestions);
    } finally {
      setLoading(false);
    }
  }

  function generateDemoQuestions(courseId: string): Question[] {
    return [
      {
        id: '1',
        course_id: courseId,
        question_text: 'Какое основное правило техники безопасности на производстве?',
        question_type: 'multiple_choice',
        options: [
          { text: 'Использование средств индивидуальной защиты', is_correct: true },
          { text: 'Быстрое выполнение работы', is_correct: false },
          { text: 'Игнорирование инструкций', is_correct: false },
          { text: 'Самостоятельное принятие решений', is_correct: false }
        ],
        difficulty: 'beginner'
      },
      {
        id: '2',
        course_id: courseId,
        question_text: 'Что нужно сделать перед началом работы с оборудованием?',
        question_type: 'multiple_choice',
        options: [
          { text: 'Проверить исправность и наличие защитных устройств', is_correct: true },
          { text: 'Сразу включить оборудование', is_correct: false },
          { text: 'Прочитать инструкцию после включения', is_correct: false },
          { text: 'Пропустить проверку', is_correct: false }
        ],
        difficulty: 'beginner'
      },
      {
        id: '3',
        course_id: courseId,
        question_text: 'Какие действия запрещены на производстве?',
        question_type: 'multiple_choice',
        options: [
          { text: 'Работа в состоянии усталости или алкогольного опьянения', is_correct: true },
          { text: 'Использование защитной одежды', is_correct: false },
          { text: 'Соблюдение инструкций', is_correct: false },
          { text: 'Вызов руководителя при неполадках', is_correct: false }
        ],
        difficulty: 'intermediate'
      },
      {
        id: '4',
        course_id: courseId,
        question_text: 'Что включает в себя СИЗ (средства индивидуальной защиты)?',
        question_type: 'multiple_choice',
        options: [
          { text: 'Каска, перчатки, защитные очки, спецодежда', is_correct: true },
          { text: 'Только перчатки', is_correct: false },
          { text: 'Только каска', is_correct: false },
          { text: 'Обычная одежда', is_correct: false }
        ],
        difficulty: 'beginner'
      },
      {
        id: '5',
        course_id: courseId,
        question_text: 'Как часто нужно проходить инструктаж по технике безопасности?',
        question_type: 'multiple_choice',
        options: [
          { text: 'Регулярно, согласно графику предприятия', is_correct: true },
          { text: 'Один раз при приеме на работу', is_correct: false },
          { text: 'По желанию работника', is_correct: false },
          { text: 'Инструктаж не обязателен', is_correct: false }
        ],
        difficulty: 'intermediate'
      }
    ];
  }

  function handleAnswerSelect(answer: string) {
    setAnswers({
      ...answers,
      [currentQuestionIndex]: answer
    });
  }

  function handleNext() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }

  function handlePrevious() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }

  async function handleSubmit() {
    if (!user) return;

    let score = 0;
    const resultsDetails: any[] = [];

    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      let isCorrect = false;

      if (question.question_type === 'multiple_choice' && question.options) {
        const correctOption = question.options.find(opt => opt.is_correct);
        isCorrect = userAnswer === correctOption?.text;
      }

      if (isCorrect) score++;

      resultsDetails.push({
        question: question.question_text,
        userAnswer,
        isCorrect
      });
    });

    const total = questions.length;
    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 75;

    const pointsMap: Record<string, number> = {
      beginner: 10,
      intermediate: 20,
      advanced: 30
    };

    let pointsEarned = 0;
    questions.forEach((q, index) => {
      if (resultsDetails[index].isCorrect) {
        pointsEarned += pointsMap[q.difficulty] || 10;
      }
    });

    if (passed) {
      pointsEarned += 50;
      if (percentage === 100) {
        pointsEarned += 50;
      }
    }

    try {
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .insert({
          course_id: course.id,
          user_id: user.id,
          questions: questions,
          status: 'completed'
        })
        .select()
        .single();

      if (testError) throw testError;

      const { error: resultError } = await supabase
        .from('test_results')
        .insert({
          test_id: testData.id,
          user_id: user.id,
          course_id: course.id,
          score,
          total_questions: total,
          percentage,
          answers: resultsDetails,
          passed,
          points_earned: pointsEarned
        });

      if (resultError) throw resultError;

      if (passed) {
        const certificateNumber = `CERT-${Date.now()}-${user.id.slice(0, 8)}`;
        await supabase
          .from('certificates')
          .insert({
            user_id: user.id,
            course_id: course.id,
            test_result_id: testData.id,
            certificate_number: certificateNumber
          });
      }

      updateUserPoints(pointsEarned);

      setResults({
        score,
        total,
        percentage,
        passed,
        pointsEarned
      });
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting test:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Загрузка теста...</p>
        </div>
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className="space-y-6">
        <div
          className={`rounded-2xl p-8 text-white shadow-xl ${
            results.passed
              ? 'bg-gradient-to-br from-green-500 to-green-600'
              : 'bg-gradient-to-br from-red-500 to-red-600'
          }`}
        >
          <div className="text-center">
            {results.passed ? (
              <CheckCircle className="w-20 h-20 mx-auto mb-4" />
            ) : (
              <XCircle className="w-20 h-20 mx-auto mb-4" />
            )}
            <h2 className="text-3xl font-bold mb-2">
              {results.passed ? 'Тест пройден!' : 'Тест не пройден'}
            </h2>
            <p className="text-lg opacity-90 mb-6">
              {results.passed
                ? 'Поздравляем! Вы успешно прошли тест.'
                : 'Попробуйте ещё раз. Для прохождения нужно 75%.'}
            </p>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <p className="text-4xl font-bold">{results.percentage}%</p>
                <p className="text-sm opacity-90">Результат</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <p className="text-4xl font-bold">
                  {results.score}/{results.total}
                </p>
                <p className="text-sm opacity-90">Правильных</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <p className="text-4xl font-bold">+{results.pointsEarned}</p>
                <p className="text-sm opacity-90">Баллов</p>
              </div>
            </div>

            {results.passed && (
              <div className="mt-6 p-4 bg-white bg-opacity-20 rounded-xl">
                <Award className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">Сертификат выдан!</p>
                <p className="text-sm opacity-90">Проверьте раздел "Профиль"</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onComplete}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          Вернуться к курсам
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Назад к курсу
        </button>

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-slate-900">
            Вопрос {currentQuestionIndex + 1} из {questions.length}
          </h2>
          <span className="text-sm text-slate-600">
            {Object.keys(answers).length}/{questions.length} ответов
          </span>
        </div>

        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          {currentQuestion.question_text}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options?.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option.text)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                answers[currentQuestionIndex] === option.text
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    answers[currentQuestionIndex] === option.text
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-slate-300'
                  }`}
                >
                  {answers[currentQuestionIndex] === option.text && (
                    <div className="w-3 h-3 bg-white rounded-full" />
                  )}
                </div>
                <span className="text-slate-900">{option.text}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Назад
        </button>

        {currentQuestionIndex < questions.length - 1 ? (
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Далее
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Завершить тест
          </button>
        )}
      </div>
    </div>
  );
}
