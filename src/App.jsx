import React, { useState } from 'react';
import { 
  Home, TrendingUp, MessageSquare, User, 
  ArrowRightLeft, ShieldCheck, PieChart, 
  ChevronRight, Sparkles, Code2, Fingerprint
} from 'lucide-react';

// --- נתונים ורכיבי עזר ---

const userData = {
  name: "חנן",
  totalCash: 125000,
  idleCash: 45000,
  potentialLoss: 1850
};

const depositOffers = [
  { 
    id: 1, 
    bankName: "בנק דיגיטל", 
    bankColor: "bg-purple-100 text-purple-700",
    interest: "4.5%", 
    period: "12 חודשים", 
    type: "ריבית קבועה", 
    liquidity: "אין תחנות יציאה",
    rating: 9.5
  },
  { 
    id: 2, 
    bankName: "בנק מסורת", 
    bankColor: "bg-blue-100 text-blue-700",
    interest: "4.1%", 
    period: "חודשי", 
    type: "ריבית משתנה (פריים)", 
    liquidity: "נזיל כל 30 יום",
    rating: 8.8
  },
  { 
    id: 3, 
    bankName: "בית השקעות מיטב", 
    bankColor: "bg-green-100 text-green-700",
    interest: "5.2%", 
    period: "24 חודשים", 
    type: "צמוד מדד", 
    liquidity: "קנס שבירה",
    rating: 7.5
  }
];

// --- רכיבים ויזואליים ---

// כפתור ניווט תחתון
const NavButton = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full py-2 transition-all duration-300 ${active ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-500'}`}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] mt-1 font-medium">{label}</span>
  </button>
);

// רכיב קרדיט פנימי - מופיע בתחתית כל מסך גלילה
const InnerCredit = () => (
  <div className="py-8 flex flex-col items-center justify-center opacity-60">
    <div className="w-12 h-0.5 bg-gray-300 rounded-full mb-3"></div>
    <div className="flex items-center space-x-2 space-x-reverse text-gray-500">
      <Code2 size={14} />
      <span className="text-xs font-medium tracking-wide">Developed by Amir Rosen</span>
    </div>
    <span className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest">Concept Prototype</span>
  </div>
);

// --- מסכים ---

const OnboardingScreen = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  
  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
      
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="flex-1 p-6 flex flex-col justify-center relative z-10">
        <div className="mb-8 text-center animate-fade-in-up">
          <div className="inline-block p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 mb-4">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold text-blue-900 mb-2 tracking-tight">Tsua+</h1>
          <p className="text-gray-500 font-medium text-lg">הכסף שלך יכול יותר.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/60 p-6 min-h-[340px] relative">
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold mb-6 text-gray-800 text-center">מה המטרה העיקרית?</h2>
              <div className="space-y-3">
                {[
                  { id: 'liquidity', text: 'זקוק לנזילות (יום גשום)', icon: ArrowRightLeft },
                  { id: 'yield', text: 'מקסום תשואה (טווח ארוך)', icon: TrendingUp },
                  { id: 'mix', text: 'שילוב מאוזן וחכם', icon: PieChart },
                ].map((opt) => (
                  <button key={opt.id} onClick={handleNext} className="w-full text-right p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group flex items-center justify-between">
                    <span className="font-medium text-gray-700 group-hover:text-blue-700">{opt.text}</span>
                    <opt.icon size={18} className="text-gray-400 group-hover:text-blue-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold mb-6 text-gray-800 text-center">רמת סיכון מועדפת?</h2>
              <div className="space-y-3">
                <button onClick={handleNext} className="w-full text-right p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                  <div className="font-bold text-gray-800">סולידי (בנק בלבד)</div>
                  <div className="text-xs text-gray-500 mt-1">פקדונות מובטחים בלבד</div>
                </button>
                <button onClick={handleNext} className="w-full text-right p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                  <div className="font-bold text-gray-800">משולב (סולידי +)</div>
                  <div className="text-xs text-gray-500 mt-1">שילוב קרנות כספיות נזילות</div>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in text-center pt-4">
               <div className="mb-6 flex justify-center relative">
                 <div className="absolute inset-0 bg-green-200 rounded-full blur-xl opacity-30 animate-pulse"></div>
                 <ShieldCheck size={72} className="text-green-500 relative z-10" />
               </div>
               <h2 className="text-xl font-bold mb-2">מנתח נתונים...</h2>
               <p className="text-gray-500 text-sm mb-8 leading-relaxed px-4">
                 אנו סורקים את האפשרויות הטובות ביותר עבורך באמצעות מנוע ה-AI שלנו.
               </p>
               <button onClick={onComplete} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg transform active:scale-95 transition-all">
                 הצג את הממצאים שלי
               </button>
            </div>
          )}

          <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2 space-x-reverse">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-6 bg-blue-600' : 'w-2 bg-gray-200'}`}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Prominent Footer Credit inside Onboarding */}
      <div className="pb-8 pt-4 text-center z-20">
        <div className="flex flex-col items-center justify-center space-y-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Concept & Design</span>
            <div className="flex items-center space-x-2 space-x-reverse bg-white/50 px-4 py-1.5 rounded-full border border-white shadow-sm backdrop-blur-sm">
                <Fingerprint size={14} className="text-blue-500" />
                <span className="text-sm font-bold text-gray-700">Amir Rosen</span>
            </div>
        </div>
      </div>
    </div>
  );
};

const DashboardScreen = ({ onNavigate }) => {
  return (
    <div className="p-5 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">שלום, {userData.name}</h2>
          <p className="text-gray-500 text-sm">בוקר טוב לפיננסים שלך</p>
        </div>
        <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100">
          <User size={24} className="text-gray-700" />
        </div>
      </div>

      {/* Main Insight Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 space-x-reverse mb-3 bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-md">
            <Sparkles size={14} className="text-yellow-300" />
            <span className="font-bold text-xs tracking-wide">תובנת AI</span>
          </div>
          <div className="flex items-baseline space-x-1 space-x-reverse mb-1">
            <h3 className="text-4xl font-extrabold tracking-tight">₪{userData.potentialLoss.toLocaleString()}</h3>
          </div>
          <p className="text-blue-100 text-sm mb-6 leading-relaxed">
            זה הסכום שניתן להוסיף לנטו שלך השנה, <br/> רק מטיפול בכסף שיושב בעו"ש.
          </p>
          <button onClick={() => onNavigate('market')} className="bg-white text-blue-700 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:bg-blue-50 transition transform hover:-translate-y-0.5 w-full sm:w-auto">
            הפוך כסף להכנסה
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col justify-between h-28">
          <div className="bg-gray-50 w-8 h-8 rounded-full flex items-center justify-center mb-2">
            <PieChart size={16} className="text-gray-600" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium">נזילות כוללת</p>
            <p className="text-lg font-bold text-gray-800">₪{userData.totalCash.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col justify-between h-28 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-16 h-full bg-red-50 -skew-x-12 translate-x-8"></div>
          <div className="bg-red-50 w-8 h-8 rounded-full flex items-center justify-center mb-2 relative z-10">
            <TrendingUp size={16} className="text-red-500" />
          </div>
          <div className="relative z-10">
            <p className="text-gray-400 text-xs font-medium">תשואה נוכחית</p>
            <div className="flex items-baseline space-x-2 space-x-reverse">
              <p className="text-lg font-bold text-gray-800">0.1%</p>
              <span className="text-[10px] text-red-500 bg-red-100 px-1.5 py-0.5 rounded-md font-bold">נמוך</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Teaser */}
      <div onClick={() => onNavigate('ai')} className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-2xl flex items-center space-x-4 space-x-reverse cursor-pointer shadow-lg text-white group">
        <div className="bg-white/10 p-2.5 rounded-xl group-hover:bg-white/20 transition">
          <MessageSquare size={20} className="text-blue-300" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold mb-0.5">צ'אט עם מומחה</p>
          <p className="text-xs text-gray-400">יש לך שאלות על המדד? הבוט זמין</p>
        </div>
        <ChevronRight size={20} className="text-gray-500 rotate-180 group-hover:text-white transition" />
      </div>

      <InnerCredit />
    </div>
  );
};

const MarketScreen = ({ onNavigate }) => {
  return (
    <div className="p-5 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-end mb-6 sticky top-0 bg-gray-50 py-2 z-10">
        <h2 className="text-2xl font-bold text-gray-900">הזדמנויות</h2>
        <span className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded-md border shadow-sm">עודכן עכשיו</span>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex space-x-3 space-x-reverse mb-6 overflow-x-auto no-scrollbar py-1">
        <button className="bg-gray-900 text-white px-5 py-2 rounded-full text-xs font-bold shadow-md whitespace-nowrap">הכל</button>
        <button className="bg-white text-gray-600 border border-gray-200 px-5 py-2 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">נזילות מיידית</button>
        <button className="bg-white text-gray-600 border border-gray-200 px-5 py-2 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">צמוד מדד</button>
      </div>

      {/* Offers List */}
      <div className="space-y-5">
        {depositOffers.map((offer) => (
          <div key={offer.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all duration-300">
            {offer.id === 1 && (
              <div className="absolute top-0 left-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-[10px] px-3 py-1.5 rounded-br-2xl font-bold shadow-sm z-10">
                הבחירה החכמה
              </div>
            )}
            
            <div className="flex justify-between items-start mb-5 relative">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm ${offer.bankColor} shadow-inner`}>
                  {offer.bankName.substring(0,2)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{offer.bankName}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{offer.type}</p>
                </div>
              </div>
              <div className="text-left bg-gray-50 px-3 py-1 rounded-xl">
                <span className="block text-2xl font-extrabold text-blue-600">{offer.interest}</span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">שנתי</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-5">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 block mb-1">תקופה</span>
                <span className="font-bold text-gray-800">{offer.period}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 block mb-1">יציאה</span>
                <span className="font-bold text-gray-800">{offer.liquidity}</span>
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse">
              <button onClick={() => onNavigate('ai')} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <MessageSquare size={16} />
                ניתוח AI
              </button>
              <button className="flex-1 py-3 bg-gray-900 rounded-xl text-sm text-white font-bold hover:bg-gray-800 shadow-lg shadow-gray-200 transition">
                הפקדה מהירה
              </button>
            </div>
          </div>
        ))}
      </div>
      <InnerCredit />
    </div>
  );
};

const AiScreen = () => {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'היי חנן, אני הבוט של Tsua+. זיהיתי שהפקדון בבנק דיגיטל מציע 4.5% קבוע. זה גבוה ב-1% מהממוצע בשוק כרגע. רוצה פרטים על נקודות היציאה?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { type: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: 'בבנק דיגיטל הכסף סגור לשנה. אם אתה חושב שתצטרך את הכסף לפני, בנק מסורת מציע נזילות חודשית אבל בריבית נמוכה יותר (4.1%). מה עדיף לך - גמישות או תשואה מקסימלית?' 
      }]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 sticky top-0 z-10 bg-white/80 backdrop-blur-md">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="relative">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">היועץ החכם</h2>
            <p className="text-xs text-gray-500">מחובר למאגר הריביות הארצי</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-sm relative ${
              msg.type === 'user' 
                ? 'bg-gray-900 text-white rounded-tr-none' 
                : 'bg-blue-50 text-gray-800 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex items-center space-x-2 space-x-reverse bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="שאל כל דבר..."
            className="flex-1 bg-transparent border-0 px-4 py-2 text-sm focus:ring-0 focus:outline-none"
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 shadow-md transition-transform active:scale-95">
            <ChevronRight size={18} className="rotate-180" />
          </button>
        </div>
        <div className="mt-4 flex justify-center opacity-40">
           <span className="text-[9px] text-gray-500 uppercase font-medium">Developed by Amir Rosen</span>
        </div>
      </div>
    </div>
  );
};

// --- אפליקציה ראשית ---

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('onboarding');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center font-sans py-12 px-4" dir="rtl">
      
      {/* Device Frame */}
      <div className="w-full max-w-[380px] h-[800px] bg-white shadow-2xl relative rounded-[3rem] border-[10px] border-gray-900 overflow-hidden ring-1 ring-black/5 flex flex-col">
        
        {/* Notch Area & Status Bar Indicator (Subtle Mockup Badge) */}
        <div className="absolute top-0 left-0 right-0 h-8 z-50 flex justify-between items-center px-6 mt-2 pointer-events-none">
             <span className="text-[10px] font-bold text-gray-800">09:41</span>
             <div className="w-32 h-7 bg-black rounded-b-2xl absolute left-1/2 -translate-x-1/2 -top-2"></div>
             <div className="flex items-center space-x-1 space-x-reverse">
                <span className="text-[8px] font-bold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded leading-none border border-gray-300">PROTOTYPE</span>
                <div className="flex space-x-1">
                   <div className="w-4 h-2.5 bg-gray-800 rounded-[1px]"></div>
                   <div className="w-0.5 h-1 bg-gray-800 rounded-sm"></div>
                </div>
             </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto bg-white scrollbar-hide relative z-0 pb-20">
          {currentScreen === 'onboarding' && <OnboardingScreen onComplete={() => setCurrentScreen('dashboard')} />}
          {currentScreen === 'dashboard' && <DashboardScreen onNavigate={setCurrentScreen} />}
          {currentScreen === 'market' && <MarketScreen onNavigate={setCurrentScreen} />}
          {currentScreen === 'ai' && <AiScreen />}
        </div>

        {/* Floating Bottom Nav */}
        {currentScreen !== 'onboarding' && (
          <div className="absolute bottom-6 left-4 right-4 bg-white/95 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl flex justify-around items-center px-2 py-3 z-50">
            <NavButton 
              icon={Home} 
              label="בית" 
              active={currentScreen === 'dashboard'} 
              onClick={() => setCurrentScreen('dashboard')} 
            />
            <NavButton 
              icon={TrendingUp} 
              label="הזדמנויות" 
              active={currentScreen === 'market'} 
              onClick={() => setCurrentScreen('market')} 
            />
            <NavButton 
              icon={MessageSquare} 
              label="ייעוץ" 
              active={currentScreen === 'ai'} 
              onClick={() => setCurrentScreen('ai')} 
            />
          </div>
        )}
      </div>

    </div>
  );
};

export default App;