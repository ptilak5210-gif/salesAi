import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, Users, MessageSquare, Settings, 
  Search, Bell, Plus, Filter, MoreHorizontal, 
  Send, Sparkles, CheckCircle, XCircle, BarChart3,
  Calendar, ArrowUpRight, LogOut, Briefcase,
  Eye, EyeOff, Loader2, Lock, Mail, User as UserIcon, Building,
  ArrowLeft, ChevronRight, Play, Zap, Shield, PieChart, Menu, X,
  Phone, MapPin, Facebook, Linkedin, Twitter, Instagram, Globe,
  Home, ArrowRight, MessageCircle, Clock, Check, ChevronLeft,
  Target, Lightbulb, Heart, Rocket, Layers, Smartphone, Bot
} from 'lucide-react';
import { Button } from './components/Button';
import { Lead, Message, Conversation, AuthSession, Deal, Meeting } from './types';
import { generateOutreachMessage, generateReply, analyzeLeadIntent } from './services/geminiService';
import { registerUser, login, validateEmail, SignupData, getCurrentSession, logout, verifyUserOtp, resendOtp } from './services/authService';
import { fetchLeads, fetchDeals, fetchMeetings, fetchMessages, sendMessage } from './services/dataService';

// --- MOCK DATA ---
const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'Sarah Miller', email: 'sarah@techcorp.com', company: 'TechCorp Inc.', role: 'CTO', status: 'Replied', score: 'Hot', source: 'LinkedIn', lastContact: '10 mins ago' },
  { id: '2', name: 'David Chen', email: 'david@growth.io', company: 'Growth.io', role: 'VP Sales', status: 'Contacted', score: 'Warm', source: 'Website', lastContact: '2 hours ago' },
  { id: '3', name: 'Emily Wilson', email: 'emily@retail.net', company: 'RetailNet', role: 'Director', status: 'New', score: 'Cold', source: 'Import', lastContact: 'Never' },
  { id: '4', name: 'James Rod', email: 'james@bigbiz.com', company: 'BigBiz', role: 'CEO', status: 'Qualified', score: 'Hot', source: 'Referral', lastContact: '1 day ago' },
];

const MOCK_CONVERSATION: Message[] = [
  { id: 'm1', sender: 'user', content: "Hi Sarah, I noticed TechCorp is scaling fast. We help companies like yours automate sales follow-ups. Would you be open to a 10-min chat?", timestamp: new Date(Date.now() - 86400000), channel: 'LinkedIn' },
  { id: 'm2', sender: 'lead', content: "Hi! Thanks for reaching out. That sounds interesting. How does the pricing work?", timestamp: new Date(Date.now() - 3600000), channel: 'LinkedIn' },
];

const MOCK_DEALS: Deal[] = [
  { id: '1', leadName: 'TechCorp Inc.', amount: 15000, stage: 'Negotiation', probability: 80 },
  { id: '2', leadName: 'BigBiz Enterprise', amount: 45000, stage: 'Proposal', probability: 50 },
  { id: '3', leadName: 'Startup One', amount: 5000, stage: 'Closed Won', probability: 100 },
];

const MOCK_MEETINGS: Meeting[] = [
  { id: '1', title: 'Product Demo', attendee: 'Sarah Miller', date: 'Today', time: '2:00 PM', type: 'Zoom' },
  { id: '2', title: 'Discovery Call', attendee: 'David Chen', date: 'Tomorrow', time: '10:00 AM', type: 'Google Meet' },
];

// --- PUBLIC VIEW TYPES ---
type PublicViewType = 'home' | 'features' | 'how-it-works' | 'pricing' | 'contact' | 'about';

// --- MOBILE NAVIGATION COMPONENTS ---

const MobileBottomNav = ({ currentView, onChangeView }: any) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'inbox', label: 'Inbox', icon: MessageSquare },
    { id: 'analytics', label: 'Stats', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-40 pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform ${
              currentView === item.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <item.icon className={`w-6 h-6 ${currentView === item.id ? 'fill-current opacity-20' : ''}`} strokeWidth={currentView === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const MobileDrawer = ({ isOpen, onClose, currentView, onChangeView, onLogout, user }: any) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-[85%] max-w-xs bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in-left border-r border-slate-800">
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
           <div className="flex items-center gap-2 text-white font-display font-bold text-xl">
              <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20"><Briefcase className="w-5 h-5 text-white"/></div>
              SalesAI
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
             <X className="w-6 h-6" />
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4">
           <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700 mb-8">
             <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shrink-0 shadow-inner">
               {user.name.charAt(0)}
             </div>
             <div className="min-w-0">
               <p className="text-white font-medium text-sm truncate">{user.name}</p>
               <p className="text-slate-500 text-xs truncate">{user.email}</p>
             </div>
             <div className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
               {user.role}
             </div>
           </div>

           <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Menu</div>
           <nav className="space-y-2">
             {[
               { id: 'automation', label: 'Automation', icon: Zap },
               { id: 'meetings', label: 'Meetings', icon: Calendar },
               { id: 'deals', label: 'Deals', icon: BarChart3 },
             ].map((item) => (
               <button
                 key={item.id}
                 onClick={() => { onChangeView(item.id); onClose(); }}
                 className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                   currentView === item.id 
                     ? 'bg-indigo-600/20 text-cyan-400 border border-indigo-500/20' 
                     : 'text-slate-300 hover:bg-slate-800'
                 }`}
               >
                 <item.icon className="w-5 h-5" />
                 {item.label}
               </button>
             ))}
           </nav>
        </div>

        <div className="p-4 border-t border-slate-800 safe-bottom">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

// --- WEBSITE COMPONENTS ---

const WebsiteNavbar = ({ onLogin, onSignup, currentView, onNavigate }: { 
  onLogin: () => void, 
  onSignup: () => void, 
  currentView: PublicViewType, 
  onNavigate: (view: PublicViewType) => void 
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const NavItem = ({ view, label }: { view: PublicViewType, label: string }) => (
    <button 
      onClick={() => { 
        if (view === 'home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          scrollToSection(view);
        }
        onNavigate(view); 
        setMobileMenuOpen(false); 
      }}
      className={`relative px-1 py-2 text-sm font-medium transition-colors hover:text-white ${
        currentView === view ? 'text-cyan-400' : 'text-slate-300'
      } group`}
    >
      {label}
      <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 transform origin-left transition-transform duration-300 ${currentView === view ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
    </button>
  );

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled || mobileMenuOpen ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); onNavigate('home'); }} className="flex items-center gap-3 group">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-xl shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
             <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col leading-none text-left">
            <span className="font-display font-bold text-xl text-white tracking-tight">SalesAI</span>
            <span className="text-[10px] text-cyan-400 font-medium tracking-widest uppercase">Vedanco</span>
          </div>
        </button>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <NavItem view="features" label="Features" />
          <NavItem view="how-it-works" label="How It Works" />
          <NavItem view="pricing" label="Pricing" />
          <NavItem view="about" label="About Us" />
          <NavItem view="contact" label="Contact" />
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button onClick={onLogin} className="text-slate-300 hover:text-white font-medium px-4 py-2 transition-colors text-sm">Log In</button>
          <button onClick={onSignup} className="relative group overflow-hidden rounded-full p-[1px]">
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 group-hover:from-cyan-300 group-hover:to-blue-500 transition-all"></span>
            <span className="relative block px-6 py-2 bg-slate-950 text-white rounded-full text-sm font-bold group-hover:bg-opacity-90 transition-all">
              Sign Up Free
            </span>
          </button>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-slate-300 hover:text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-white/5 p-6 flex flex-col gap-4 animate-fade-in shadow-2xl">
          <NavItem view="features" label="Features" />
          <NavItem view="how-it-works" label="How It Works" />
          <NavItem view="pricing" label="Pricing" />
          <NavItem view="about" label="About Us" />
          <NavItem view="contact" label="Contact" />
          <div className="h-px bg-white/5 my-2"></div>
          <button onClick={() => {onLogin(); setMobileMenuOpen(false);}} className="text-left py-3 text-slate-300 font-medium">Log In</button>
          <button onClick={() => {onSignup(); setMobileMenuOpen(false);}} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-bold shadow-lg">Sign Up Free</button>
        </div>
      )}
    </nav>
  );
};

const Footer = ({ onNavigate }: { onNavigate: (view: PublicViewType) => void }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 pt-20 pb-10 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <h3 className="text-white text-xl font-display font-bold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-cyan-400" /> Vedanco IT Solutions
            </h3>
            <p className="text-sm leading-relaxed">
              Empowering businesses with intelligent automation and cutting-edge software solutions. We transform how you connect with customers through AI.
            </p>
            <div className="flex gap-4">
              <a href="https://www.linkedin.com/company/vedanco/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-cyan-500 hover:text-cyan-400 transition-all">
                <Linkedin className="w-4 h-4"/>
              </a>
              <a href="https://x.com/vedanco_group?s=11" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-cyan-500 hover:text-cyan-400 transition-all">
                <Twitter className="w-4 h-4"/>
              </a>
              <a href="https://www.instagram.com/vedanco_official?igsh=eXAwcXZuY2l5dDgz" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:border-cyan-500 hover:text-cyan-400 transition-all">
                <Instagram className="w-4 h-4"/>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => { scrollToSection('features'); onNavigate('features'); }} className="hover:text-cyan-400 transition-colors">Features</button></li>
              <li><button onClick={() => { scrollToSection('pricing'); onNavigate('pricing'); }} className="hover:text-cyan-400 transition-colors">Pricing</button></li>
              <li><button onClick={() => { scrollToSection('how-it-works'); onNavigate('how-it-works'); }} className="hover:text-cyan-400 transition-colors">How It Works</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => { scrollToSection('about'); onNavigate('about'); }} className="hover:text-cyan-400 transition-colors">About Us</button></li>
              <li><button onClick={() => { scrollToSection('contact'); onNavigate('contact'); }} className="hover:text-cyan-400 transition-colors">Contact Us</button></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-6">Contact</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                <span>
                  InfoCity, Super Mall - 1,<br/>
                  Office No. 421/M,<br/>
                  Gandhinagar, Gujarat – India
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-cyan-500 shrink-0" />
                <a href="tel:+916353097642" className="hover:text-white transition-colors">+91-6353097642</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-cyan-500 shrink-0" />
                <a href="mailto:vedanco.offical@gmail.com" className="hover:text-white transition-colors">vedanco.offical@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-900 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Vedanco IT Solutions. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-cyan-400">Privacy Policy</a>
            <a href="#" className="hover:text-cyan-400">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- HERO SLIDER ---
const HeroSlider = ({ onSignup, onNavigate }: { onSignup: () => void, onNavigate: (view: PublicViewType) => void }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      title: "Automate Your Sales Outreach with Intelligent AI",
      subtitle: "AI that works 24/7 to convert leads into meetings. Let SalesAI handle the manual work while you focus on closing.",
      cta: "Get Started Free",
      action: onSignup,
      bg: "bg-slate-950"
    },
    {
      title: "Smart Follow-Ups That Never Miss",
      subtitle: "AI-driven follow-ups that increase conversions by 300%. Nurture every lead with personalized context.",
      cta: "View Demo",
      action: onSignup,
      bg: "bg-slate-950"
    },
    {
      title: "One Dashboard. Complete Sales Control.",
      subtitle: "Leads, conversations, meetings, and analytics in one unified place. Connect WhatsApp, LinkedIn, and Email effortlessly.",
      cta: "Explore Features",
      action: () => onNavigate('features'),
      bg: "bg-slate-950"
    }
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(nextSlide, 6000);
      return () => clearInterval(interval);
    }
  }, [isPaused, nextSlide]);

  return (
    <div 
      className="relative h-screen min-h-[700px] flex items-center overflow-hidden bg-slate-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
         <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow delay-500"></div>
         <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px]"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-125 brightness-100"></div>
      </div>

      {slides.map((slide, index) => (
        <div 
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out flex items-center justify-center ${
            index === currentSlide 
              ? 'opacity-100 translate-y-0 z-10' 
              : 'opacity-0 translate-y-8 z-0'
          }`}
        >
          <div className="relative z-20 max-w-5xl mx-auto px-6 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-sm font-medium animate-fade-in-up">
              <Sparkles className="w-4 h-4" />
              <span>Next Gen Sales Automation</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-white leading-[1.1] animate-fade-in-up delay-100">
              {index === currentSlide && (
                 <>
                  {slide.title.split(' ').map((word, i) => (
                    <span key={i} className="inline-block mr-3">{word}</span>
                  ))}
                 </>
              )}
            </h1>
            
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
              {slide.subtitle}
            </p>
            
            <div className="flex justify-center pt-6 animate-fade-in-up delay-300">
              <button 
                onClick={slide.action} 
                className="group relative px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-cyan-50 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(34,211,238,0.5)] flex items-center justify-center gap-2"
              >
                {slide.cta} 
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      ))}

      <button onClick={prevSlide} className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-3 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all border border-transparent hover:border-white/10 backdrop-blur-sm">
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button onClick={nextSlide} className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-3 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all border border-transparent hover:border-white/10 backdrop-blur-sm">
        <ChevronRight className="w-8 h-8" />
      </button>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 flex gap-4">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'bg-cyan-400 w-12 shadow-[0_0_10px_#22d3ee]' : 'bg-white/20 w-8 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
};

// --- PAGES ---
const AboutPage = () => (
  <div id="about" className="min-h-screen bg-slate-950 pt-32">
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-24 animate-fade-in-up">
        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">About Us</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Innovating the future of sales automation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-32 items-center">
        <div className="order-2 md:order-1 animate-fade-in-up delay-100">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg"><Briefcase className="w-6 h-6 text-white"/></div>
            Vedanco IT Solutions
          </h2>
          <p className="text-slate-300 leading-relaxed mb-6 text-lg">
            Vedanco IT Solutions is a premier software development and IT services company dedicated to delivering quality and innovation. 
            We specialize in building robust SaaS platforms that solve real-world business problems.
          </p>
          <p className="text-slate-400 leading-relaxed">
            With a team of expert engineers and designers, we created SalesAI to bridge the gap between complex sales processes and efficient automation. 
            Our commitment is to provide tools that empower businesses to scale without limits.
          </p>
        </div>
        <div className="order-1 md:order-2 glass-panel p-8 rounded-3xl animate-fade-in-up delay-200 hover:-translate-y-2 transition-transform duration-500">
          <div className="w-full h-64 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-white/5 mb-6 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             <Rocket className="w-20 h-20 text-slate-700 group-hover:text-cyan-400 transition-colors duration-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">What is SalesAI?</h3>
          <p className="text-slate-400 mb-6">
            SalesAI is our flagship outreach automation platform designed for modern businesses. It leverages advanced Gemini AI to personalize communication.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
        <div className="glass-panel p-10 rounded-3xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] group-hover:bg-indigo-600/20 transition-all"></div>
          <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-8">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
          <p className="text-slate-400 leading-relaxed text-lg">
            To help businesses automate their sales workflows, improve efficiency, and achieve sustainable growth by reducing manual effort through intelligent AI solutions.
          </p>
        </div>
        <div className="glass-panel p-10 rounded-3xl relative overflow-hidden group hover:border-cyan-500/30 transition-colors duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-[80px] group-hover:bg-cyan-600/20 transition-all"></div>
          <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 mb-8">
            <Lightbulb className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
          <p className="text-slate-400 leading-relaxed text-lg">
            To become a trusted global provider of AI SaaS solutions, supporting startups and enterprises alike in their journey towards digital transformation.
          </p>
        </div>
      </div>

      <div className="text-center mb-20">
        <h2 className="text-3xl font-bold text-white mb-12">Why Choose Vedanco?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { title: "Innovation", desc: "Latest Gemini AI models.", icon: Zap, color: "text-amber-400" },
             { title: "Reliability", desc: "99.9% Uptime guarantee.", icon: Shield, color: "text-emerald-400" },
             { title: "Scalability", desc: "Grow with no limits.", icon: BarChart3, color: "text-blue-400" },
             { title: "Support", desc: "24/7 Expert assistance.", icon: Heart, color: "text-rose-400" },
           ].map((item, i) => (
             <div key={i} className="group p-8 glass-panel rounded-2xl hover:bg-slate-800 transition-all duration-300 hover:-translate-y-1">
               <div className={`w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center ${item.color} border border-white/5 mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                 <item.icon className="w-6 h-6" />
               </div>
               <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
               <p className="text-slate-400 text-sm">{item.desc}</p>
             </div>
           ))}
        </div>
      </div>
    </div>
  </div>
);

const FeaturesPage = () => (
  <div id="features" className="min-h-screen bg-slate-950 pt-32">
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-24 animate-fade-in-up">
        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">Powerful Features</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          A complete suite of tools to supercharge your outreach.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
        {[
          { icon: Zap, title: "AI Outreach Automation", desc: "Craft hyper-personalized sequences that feel human. Our AI adapts tone based on prospect data." },
          { icon: MessageCircle, title: "Multi-Channel Messaging", desc: "Reach prospects where they are active. Seamlessly orchestrate Email, LinkedIn, and WhatsApp." },
          { icon: Clock, title: "Smart Follow-Ups", desc: "Never let a lead go cold. The system automatically schedules timely follow-ups until you get a reply." },
          { icon: Users, title: "AI Lead Qualification", desc: "Stop chasing bad leads. SalesAI scores every prospect based on intent signals and engagement." },
          { icon: MessageSquare, title: "Unified Inbox", desc: "Manage all your conversations in one place. No more switching between tabs." },
          { icon: BarChart3, title: "Analytics Dashboard", desc: "Get real-time visibility into pipeline health, conversion rates, and team performance." },
        ].map((feat, i) => (
          <div key={i} className="group p-8 rounded-3xl glass-panel hover:bg-slate-800/80 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-t border-white/10">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5">
              <feat.icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">{feat.title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const HowItWorksPage = () => (
  <div id="how-it-works" className="min-h-screen bg-slate-950 pt-32">
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-24 animate-fade-in-up">
        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">How SalesAI Works</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">From cold lead to closed deal — a fully automated workflow.</p>
      </div>

      <div className="relative mb-32 max-w-5xl mx-auto">
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500 via-purple-500 to-transparent md:-translate-x-px"></div>

        <div className="space-y-20">
          {[
            { step: 1, title: "Create Account", desc: "Sign up and set up your company workspace. Define your ideal customer profile.", icon: UserIcon },
            { step: 2, title: "Add Leads", desc: "Import contacts via CSV or sync directly from your CRM. The AI enriches their data.", icon: Users },
            { step: 3, title: "AI Sends Outreach", desc: "SalesAI crafts personalized messages and sends them via Email or LinkedIn.", icon: Send },
            { step: 4, title: "AI Handles Replies", desc: "When a prospect replies, our AI drafts an intelligent response or answers questions.", icon: MessageSquare },
            { step: 5, title: "Meeting Booking", desc: "Qualified leads are guided to book a demo on your calendar automatically.", icon: Calendar },
            { step: 6, title: "Close Deals", desc: "Track revenue, analyze performance, and celebrate your wins.", icon: CheckCircle }
          ].map((item, i) => (
            <div key={i} className={`relative flex items-center md:justify-between ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} group`}>
              <div className="hidden md:block w-5/12"></div>
              
              <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-slate-900 border-4 border-slate-800 group-hover:border-cyan-500 z-10 flex items-center justify-center text-white transition-colors duration-300 shadow-xl">
                 <item.icon className="w-5 h-5" />
              </div>

              <div className="ml-24 md:ml-0 md:w-5/12 glass-panel p-8 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all hover:-translate-y-1 relative">
                <div className="absolute top-8 -left-2 w-4 h-4 bg-slate-800 rotate-45 border-l border-b border-white/5 md:hidden"></div>
                <div className={`hidden md:block absolute top-8 w-4 h-4 bg-slate-800 rotate-45 border-l border-b border-white/5 ${i % 2 === 0 ? '-left-2' : '-right-2 border-r border-t border-l-0 border-b-0'}`}></div>
                
                <span className="text-cyan-500 font-bold text-sm tracking-wider uppercase mb-2 block">Step {item.step}</span>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const PricingPage = ({ onSignup }: { onSignup: () => void }) => (
  <div id="pricing" className="min-h-screen bg-slate-950 pt-32">
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-24 animate-fade-in-up">
        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">Simple Pricing</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">Choose the plan that fits your growth stage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { 
              name: "Starter", 
              price: "$49", 
              desc: "Perfect for solo founders.",
              features: ["500 Leads/month", "Basic Email Automation", "Standard Templates", "Community Support"] 
            },
            { 
              name: "Pro", 
              price: "$149", 
              desc: "For growing teams.",
              recommended: true,
              features: ["2,500 Leads/month", "Email + LinkedIn Outreach", "Advanced AI Personalization", "Smart Analytics", "Priority Support"] 
            },
            { 
              name: "Business", 
              price: "$399", 
              desc: "Ultimate scale.",
              features: ["Unlimited Leads", "Omni-channel (Email, LI, WhatsApp)", "Dedicated Success Manager", "Custom AI Training", "API Access"] 
            }
          ].map((plan, i) => (
            <div key={i} className={`relative p-8 rounded-3xl glass-panel flex flex-col transition-all duration-300 ${plan.recommended ? 'border-cyan-500 shadow-2xl shadow-cyan-500/10 md:-translate-y-4 z-10' : 'hover:border-slate-600'}`}>
              {plan.recommended && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide shadow-lg">Most Popular</div>}
              
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-slate-400 text-sm mb-6">{plan.desc}</p>
              
              <div className="text-5xl font-display font-bold text-white mb-8 tracking-tight">{plan.price}<span className="text-lg text-slate-500 font-sans font-normal ml-1">/mo</span></div>
              
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-slate-300 text-sm">
                    <CheckCircle className="w-5 h-5 text-cyan-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={onSignup} 
                className={`w-full py-4 rounded-xl font-bold transition-all ${plan.recommended ? 'bg-white text-slate-900 hover:bg-cyan-50' : 'bg-slate-800 text-white hover:bg-slate-700 border border-white/10'}`}
              >
                {plan.name === 'Business' ? 'Contact Sales' : `Get Started`}
              </button>
            </div>
          ))}
        </div>
    </div>
  </div>
);

const ContactPage = () => (
  <div id="contact" className="min-h-screen bg-slate-950 pt-32 pb-20">
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-24 animate-fade-in-up">
        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">Get in Touch</h1>
        <p className="text-xl text-slate-400">We are here to help your business grow.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
        
        <div className="p-12 bg-gradient-to-br from-indigo-900/40 to-slate-900 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[60px]"></div>
          
          <div className="relative z-10 space-y-10">
             <div>
                <h3 className="text-2xl font-bold text-white mb-2">Vedanco IT Solutions</h3>
                <p className="text-indigo-200 text-sm font-medium">Premier Software & IT Services</p>
             </div>

             <div className="space-y-8">
                <div className="flex items-start gap-5 group">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Office Address</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      InfoCity, Super Mall - 1,<br/>
                      Office No. 421/M,<br/>
                      Gandhinagar, Gujarat – India
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Phone</h4>
                    <a href="tel:+916353097642" className="text-slate-400 text-sm hover:text-white transition-colors">+91-6353097642</a>
                  </div>
                </div>

                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-1">Email</h4>
                    <a href="mailto:vedanco.offical@gmail.com" className="text-slate-400 text-sm hover:text-white transition-colors">vedanco.offical@gmail.com</a>
                  </div>
                </div>
             </div>
          </div>

          <div className="mt-12 relative z-10">
            <h4 className="text-white font-medium mb-6">Connect With Us</h4>
            <div className="flex gap-4">
               {[
                 { icon: Instagram, url: "https://www.instagram.com/vedanco_official?igsh=eXAwcXZuY2l5dDgz" },
                 { icon: Linkedin, url: "https://www.linkedin.com/company/vedanco/" },
                 { icon: Twitter, url: "https://x.com/vedanco_group?s=11" }
               ].map((social, i) => (
                 <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-cyan-500 hover:border-cyan-500 hover:scale-110 transition-all duration-300">
                   <social.icon className="w-5 h-5"/>
                 </a>
               ))}
            </div>
          </div>
        </div>

        <div className="p-12 bg-slate-900">
           <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Thanks for contacting us! We will get back to you shortly."); }}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                  <input type="email" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all" placeholder="you@company.com" required />
                </div>
             </div>
             
             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
               <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all appearance-none cursor-pointer">
                 <option>Sales Inquiry</option>
                 <option>Support Request</option>
                 <option>Partnership</option>
                 <option>Other</option>
               </select>
             </div>
             
             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message</label>
               <textarea rows={5} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all resize-none" placeholder="Tell us about your project..." required></textarea>
             </div>
             
             <button type="submit" className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 transform hover:-translate-y-1">
               Send Message
             </button>
           </form>
        </div>

      </div>
    </div>
  </div>
);

// --- AUTH SCREEN ---
const AuthScreen = ({ onAuthSuccess, onBack, initialMode }: any) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  // Using 'email' state for both Email and User ID in login mode
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationMode, setVerificationMode] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Email/ID and password are required");
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        const session = await login(email, password);
        onAuthSuccess(session);
      } else {
        if (!name || !company) {
           setError("Name and Company are required for signup");
           setLoading(false);
           return;
        }
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        await registerUser({ name, email, password, companyName: company });
        setVerificationMode(true);
        setResendTimer(60); // Start 60s timer on initial send
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleResendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      await resendOtp(email);
      setResendTimer(60); // Reset timer to 60s
      setError("New code sent! Check your email."); // Using error state for success message temporarily
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await verifyUserOtp(email, otp);
      onAuthSuccess(session);
    } catch (err: any) {
      setError(err.message || "Verification failed. Please check your OTP.");
    } finally {
      setLoading(false);
    }
  };

  if (verificationMode) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
         <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px]"></div>

         <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10 animate-fade-in-up">
          <div className="text-center mb-8">
             <h2 className="text-2xl font-bold text-white">Verify Email</h2>
             <p className="text-slate-400 mt-2">
               We've sent a 6-digit code to <strong>{email}</strong>. Please enter it below to verify your account.
             </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200 text-sm">
               <XCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">6-Digit Verification Code</label>
              <input 
                type="text" 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 6))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-center text-3xl font-bold tracking-[0.5em] text-cyan-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                placeholder="000000"
                maxLength={6}
              />
              <p className="text-[10px] text-slate-500 mt-2 text-center italic">
                Check your email for a 6-digit code.
              </p>
            </div>
            <Button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20" isLoading={loading}>
              Verify & Continue
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500 space-y-4">
             {resendTimer > 0 ? (
               <p className="text-slate-400">Resend code in <span className="text-white font-bold">{resendTimer}s</span></p>
             ) : (
               <button 
                 onClick={handleResendOtp} 
                 disabled={loading}
                 className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 Resend Code
               </button>
             )}
             
             <div className="pt-4 border-t border-white/5">
                <p>Wrong email? <button onClick={() => setVerificationMode(false)} className="text-slate-400 hover:text-white transition-colors">Change email</button></p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]"></div>
       <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px]"></div>

       <div className="absolute top-8 left-8 z-10">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>

      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
           <h2 className="text-2xl font-bold text-white">
             {mode === 'login' ? 'Welcome Back' : 'Create Account'}
           </h2>
           <p className="text-slate-400 mt-2">
             {mode === 'login' ? 'Sign in to your Vedanco workspace' : 'Start automating your sales today'}
           </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200 text-sm">
             <XCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Company Name</label>
                <input 
                  type="text" 
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                  placeholder="Acme Inc."
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {mode === 'login' ? 'Email or User ID' : 'Email'}
            </label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              placeholder={mode === 'login' ? "user@example.com" : "name@company.com"}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Password</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Confirm Password</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          )}
          <Button type="submit" className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20" isLoading={loading}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
           {mode === 'login' ? (
             <p>Don't have an account? <button onClick={() => setMode('signup')} className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline">Sign up</button></p>
           ) : (
             <p>Already have an account? <button onClick={() => setMode('login')} className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline">Log in</button></p>
           )}
        </div>
        
        {mode === 'login' && (
           <div className="mt-4 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 space-y-1">
             {/* Credentials removed as per request */}
           </div>
        )}
      </div>
    </div>
  );
};

// --- AUTHENTICATED COMPONENTS ---

const WhatsAppIntegration = ({ connected, onConnect, onDisconnect }: any) => (
  <div className="max-w-4xl mx-auto animate-fade-in">
    <h2 className="text-2xl font-bold text-slate-800 mb-6">WhatsApp Business Integration</h2>
    
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex items-center gap-6">
        <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center border border-green-100">
          <MessageCircle className="w-10 h-10 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
            WhatsApp Business API
            {connected ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">Connected</span>
            ) : (
              <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full uppercase tracking-wide">Not Connected</span>
            )}
          </h3>
          <p className="text-slate-500 mt-1">Send automated messages and AI replies directly to your leads' WhatsApp.</p>
        </div>
      </div>

      <div className="p-8 bg-slate-50/50">
        {!connected ? (
          <div className="max-w-lg">
            <h4 className="font-bold text-slate-800 mb-2">Connect your account</h4>
            <p className="text-sm text-slate-500 mb-6">
              To start sending messages, you need to connect your Meta Business account. This will allow SalesAI to send templates and receive replies.
            </p>
            <Button onClick={onConnect} className="bg-[#25D366] hover:bg-[#128C7E] text-white border-none">
              <MessageCircle className="w-4 h-4 mr-2" />
              Connect WhatsApp Business
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Connected Number</p>
                <p className="font-mono text-slate-700 font-medium">+1 (555) 012-3456</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Status</p>
                <p className="text-green-600 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Active & Healthy
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" onClick={onConnect}>Reconnect</Button>
              <Button variant="outline" className="text-red-600 hover:bg-red-50 border-red-200" onClick={onDisconnect}>Disconnect</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

const EmailIntegration = ({ connected, onConnect }: any) => {
  const [loading, setLoading] = useState(false);
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onConnect();
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Email (SMTP) Configuration</h2>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">SMTP Settings</h3>
            <p className="text-sm text-slate-500">Configure your email provider for outreach.</p>
          </div>
          <div className="ml-auto">
             {connected ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase tracking-wide">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div> Disconnected
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMTP Host</label>
              <input type="text" defaultValue={connected ? "smtp.gmail.com" : ""} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="smtp.example.com" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Port</label>
              <input type="text" defaultValue={connected ? "587" : ""} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="587" required />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
            <input type="email" defaultValue={connected ? "demo@salesai.com" : ""} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="you@company.com" required />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password / App Key</label>
            <input type="password" defaultValue={connected ? "password123" : ""} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••••••••" required />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
             <Button type="submit" isLoading={loading} className="px-8">
               {connected ? 'Update Settings' : 'Save & Connect'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Sidebar = ({ currentView, onChangeView, onLogout, user, whatsappConnected, emailConnected }: any) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'inbox', label: 'Inbox', icon: MessageSquare },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'deals', label: 'Deals', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 h-screen fixed left-0 top-0 border-r border-slate-800 text-slate-300 transition-all duration-300">
      <div className="p-6 flex items-center gap-3 text-white font-display font-bold text-xl tracking-tight border-b border-slate-800/50">
        <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20">
          <Briefcase className="w-5 h-5 text-white"/>
        </div>
        SalesAI
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Main Menu</p>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
              currentView === item.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
            {item.label}
          </button>
        ))}

        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-8">Integrations</p>
        
        <button
          onClick={() => onChangeView('whatsapp')}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
            currentView === 'whatsapp'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <MessageCircle className={`w-5 h-5 ${currentView === 'whatsapp' ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
          <span className="flex-1 text-left">WhatsApp Business</span>
          <div className={`w-2 h-2 rounded-full ${whatsappConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></div>
        </button>

        <button
          onClick={() => onChangeView('email')}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
            currentView === 'email'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Mail className={`w-5 h-5 ${currentView === 'email' ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
          <span className="flex-1 text-left">Email (SMTP)</span>
          <div className={`w-2 h-2 rounded-full ${emailConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></div>
        </button>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-inner text-sm">
             {user.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
             <p className="text-sm font-medium text-white truncate">{user.name}</p>
             <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

const PlaceholderView = ({ title, icon: Icon }: any) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-white rounded-2xl border border-slate-100 shadow-sm animate-fade-in">
    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 animate-bounce-slow">
      <Icon className="w-10 h-10 text-slate-400" />
    </div>
    <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
    <p className="text-slate-500 max-w-md">
      This module is currently under development. Check back soon for updates!
    </p>
    <Button variant="outline" className="mt-8" onClick={() => {}}>
      Notify Me When Ready
    </Button>
  </div>
);

const PublicLayout = ({ children, onLogin, onSignup, currentView, onNavigate }: any) => (
  <div className="bg-slate-950 min-h-screen text-slate-200 font-sans selection:bg-cyan-500/30">
    <WebsiteNavbar onLogin={onLogin} onSignup={onSignup} currentView={currentView} onNavigate={onNavigate} />
    {children}
    <Footer onNavigate={onNavigate} />
  </div>
);

const HomeView = ({ onSignup, onNavigate }: any) => (
  <div className="animate-fade-in">
    <HeroSlider onSignup={onSignup} onNavigate={onNavigate} />
    <WorkflowSection />
  </div>
);

const MarketingIllustration = () => (
  <div className="relative w-full aspect-[6/5] bg-[#020617] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col group/illustration">
    {/* Futuristic Background Gradients */}
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)]"></div>
    </div>

    {/* Header / Browser Bar */}
    <div className="h-10 bg-slate-900/40 border-b border-white/5 flex items-center px-4 gap-1.5 relative z-10 backdrop-blur-md">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/30"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30"></div>
      </div>
      <div className="ml-4 h-5 w-48 bg-white/5 rounded-md flex items-center px-2 border border-white/5">
        <div className="w-3 h-3 bg-blue-500/20 rounded-sm mr-2"></div>
        <div className="h-0.5 w-24 bg-white/10 rounded-full"></div>
      </div>
    </div>

    <div className="flex-1 p-6 grid grid-cols-12 gap-4 relative z-10">
      {/* Funnel Background Graphic (Subtle) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none">
        <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-pulse-slow">
          <path d="M50 50 L350 50 L250 350 L150 350 Z" fill="url(#funnelGradient)" />
          <defs>
            <linearGradient id="funnelGradient" x1="200" y1="50" x2="200" y2="350" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" />
              <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 1. Meta Ads Lead Form (Top Left) */}
      <div className="col-span-5 space-y-3 animate-fade-in-up">
        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(59,130,246,0.05)] relative group/ad backdrop-blur-xl hover:border-blue-500/30 transition-all duration-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                <Facebook className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">Lead Gen Ad</span>
            </div>
            <div className="px-2 py-0.5 bg-blue-500/10 rounded text-[8px] font-bold text-blue-400 border border-blue-500/20 animate-pulse">LIVE</div>
          </div>
          <div className="space-y-2">
            <div className="h-1 w-full bg-white/5 rounded-full"></div>
            <div className="h-1 w-3/4 bg-white/5 rounded-full"></div>
            <div className="h-8 w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg mt-4 flex items-center justify-center text-[10px] text-white font-bold shadow-lg shadow-blue-600/20 group-hover/ad:shadow-blue-500/40 transition-all cursor-default">
              Sign Up Now
            </div>
          </div>
          {/* Connector Arrow Line */}
          <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-px bg-gradient-to-r from-blue-500 to-emerald-500 opacity-50">
            <div className="absolute right-0 -top-1 border-r border-t border-emerald-500 w-2 h-2 rotate-45"></div>
          </div>
        </div>
      </div>

      {/* 2. WhatsApp Chat (Top Right) */}
      <div className="col-span-7 space-y-3 animate-fade-in-up delay-200">
        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(16,185,129,0.05)] h-full flex flex-col relative overflow-hidden backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">WhatsApp AI</span>
            </div>
            <div className="px-2 py-0.5 bg-emerald-500/10 rounded text-[8px] font-bold text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Zap className="w-2 h-2 fill-current" /> Instant
            </div>
          </div>
          <div className="space-y-3 flex-1">
            {/* Customer Bubble */}
            <div className="flex justify-start">
              <div className="bg-white/5 p-2.5 rounded-2xl rounded-tl-none border border-white/5 text-[10px] text-slate-400 max-w-[85%] leading-tight">
                Hi! I just saw your ad. Can I get a demo?
              </div>
            </div>
            {/* AI Assistant Bubble */}
            <div className="flex justify-end">
              <div className="bg-emerald-600/90 p-2.5 rounded-2xl rounded-tr-none text-[10px] text-white max-w-[85%] shadow-lg shadow-emerald-600/20 relative border border-emerald-400/20">
                <div className="absolute -left-7 top-0 w-6 h-6 bg-slate-900 rounded-full border border-white/10 flex items-center justify-center shadow-sm">
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="leading-tight">Absolutely! I've just sent a demo link to your email. Would you like to schedule a call too?</p>
                <div className="mt-1 text-[8px] text-emerald-100/60 flex items-center gap-1">
                  <Check className="w-2 h-2" /> Sent instantly
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CRM Dashboard (Bottom) */}
      <div className="col-span-12 mt-4 animate-fade-in-up delay-500">
        <div className="bg-white/[0.02] rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative backdrop-blur-2xl hover:border-indigo-500/30 transition-all duration-500">
          {/* Meeting Booked Notification (Floating) */}
          <div className="absolute top-4 right-4 z-20 animate-bounce-slow">
            <div className="bg-indigo-600/90 text-white px-3 py-2 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.5)] flex items-center gap-2 border border-indigo-400/30 backdrop-blur-md">
              <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-3 h-3" />
              </div>
              <div className="text-left">
                <p className="text-[8px] font-bold uppercase tracking-widest opacity-70">New Meeting</p>
                <p className="text-[10px] font-bold">Demo with Mike Ross</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <LayoutDashboard className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Lead Pipeline</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                <span className="text-[9px] font-medium text-slate-500">WhatsApp Active</span>
              </div>
              <div className="h-4 w-px bg-white/10"></div>
              <div className="flex gap-1">
                <div className="w-5 h-5 rounded bg-white/5 border border-white/5"></div>
                <div className="w-5 h-5 rounded bg-white/5 border border-white/5"></div>
              </div>
            </div>
          </div>
          
          <div className="p-4 grid grid-cols-3 gap-4">
            {/* Stage 1: New Leads */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">New Leads</span>
                <span className="text-[9px] font-bold text-slate-600">12</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-2 hover:bg-white/[0.08] transition-all group/card">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300">John Doe</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>
                </div>
                <div className="flex items-center gap-1 text-[8px] text-slate-500">
                  <Facebook className="w-2.5 h-2.5" /> Meta Ads • 2m ago
                </div>
              </div>
            </div>

            {/* Stage 2: Follow-up */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Follow-up</span>
                <span className="text-[9px] font-bold text-slate-600">8</span>
              </div>
              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex flex-col gap-2 border-l-2 border-l-emerald-500 shadow-[inset_0_0_20px_rgba(16,185,129,0.02)]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300">Sarah Smith</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                </div>
                <div className="flex items-center gap-1 text-[8px] text-emerald-400 font-medium">
                  <MessageCircle className="w-2.5 h-2.5" /> AI Replied • Active
                </div>
              </div>
            </div>

            {/* Stage 3: Conversion */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Conversion</span>
                <span className="text-[9px] font-bold text-slate-600">5</span>
              </div>
              <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex flex-col gap-2 border-l-2 border-l-indigo-500">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300">Mike Ross</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"></div>
                </div>
                <div className="flex items-center gap-1 text-[8px] text-indigo-400 font-medium">
                  <Calendar className="w-2.5 h-2.5" /> Demo Scheduled
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 right-1/3 text-blue-400/20 animate-pulse">
        <Sparkles className="w-5 h-5" />
      </div>
      <div className="absolute bottom-1/3 left-1/4 text-indigo-400/20 animate-pulse delay-700">
        <Sparkles className="w-4 h-4" />
      </div>
    </div>
  </div>
);

const WorkflowSection = () => (
  <section className="py-24 bg-slate-950 relative overflow-hidden border-t border-white/5">
    <div className="absolute inset-0 z-0">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
    </div>
    
    <div className="max-w-7xl mx-auto px-6 relative z-10">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6 tracking-tight">
          Smart Follow-Ups That Never Miss
        </h2>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Automatically reply to Meta Ads leads on WhatsApp, follow up with AI, and convert leads into meetings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-12">
          <div className="flex gap-6 group">
            <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 shrink-0">
              <Facebook className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Meta Ads Lead Gen</h3>
              <p className="text-slate-400">Capture high-intent leads directly from Facebook and Instagram ads with instant sync.</p>
            </div>
          </div>

          <div className="flex gap-6 group">
            <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center text-green-400 group-hover:bg-green-500 group-hover:text-white transition-all duration-300 shrink-0">
              <MessageCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">WhatsApp Automation</h3>
              <p className="text-slate-400">Instantly trigger personalized WhatsApp conversations the moment a lead is captured.</p>
            </div>
          </div>

          <div className="flex gap-6 group">
            <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300 shrink-0">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">AI Smart Replies</h3>
              <p className="text-slate-400">Our AI analyzes customer intent and replies automatically, keeping the conversation warm 24/7.</p>
            </div>
          </div>

          <div className="flex gap-6 group">
            <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shrink-0">
              <LayoutDashboard className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">CRM Tracking</h3>
              <p className="text-slate-400">Monitor every interaction, lead score, and follow-up status in one unified dashboard.</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-3xl blur-2xl"></div>
          <div className="relative group">
            <MarketingIllustration />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none rounded-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const DashboardView = ({ session, whatsappConnected, emailConnected }: any) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [l, d, m] = await Promise.all([fetchLeads(), fetchDeals(), fetchMeetings()]);
        setLeads(l);
        setDeals(d);
        setMeetings(m);
      } catch (e) {
        console.error("Error loading dashboard data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = [
    { label: 'Total Leads', value: leads.length, change: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Deals', value: deals.length, change: '+5%', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Meetings', value: meetings.length, change: '+2', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Revenue', value: '$' + deals.reduce((acc, d) => acc + d.amount, 0).toLocaleString(), change: '+18%', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome back, {session.user.name}</h2>
          <p className="text-slate-500">Here's what's happening with your pipeline today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={<Filter className="w-4 h-4"/>}>Filter</Button>
          <Button icon={<Plus className="w-4 h-4"/>}>Add Widget</Button>
        </div>
      </div>

      {/* Channels Section */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" /> Active Channels
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-green-200 transition-all">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                 <MessageCircle className="w-6 h-6" />
               </div>
               <div>
                 <h4 className="font-bold text-slate-800">WhatsApp Business</h4>
                 <p className="text-xs text-slate-500">{whatsappConnected ? 'Connected: +1 (555)...' : 'Not connected'}</p>
               </div>
             </div>
             {whatsappConnected ? (
               <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active</span>
             ) : (
               <Button size="sm" variant="outline" className="text-xs h-8">Connect Now</Button>
             )}
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                 <Mail className="w-6 h-6" />
               </div>
               <div>
                 <h4 className="font-bold text-slate-800">Email (SMTP)</h4>
                 <p className="text-xs text-slate-500">{emailConnected ? 'Connected: demo@salesai.com' : 'Not connected'}</p>
               </div>
             </div>
             {emailConnected ? (
               <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active</span>
             ) : (
               <Button size="sm" variant="outline" className="text-xs h-8">Connect Now</Button>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{stat.change}</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Recent Leads</h3>
            <Button variant="ghost" size="sm" className="text-indigo-600">View All</Button>
          </div>
            <div className="space-y-4">
              {leads.slice(0, 3).map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{lead.name}</h4>
                      <p className="text-xs text-slate-500">{lead.company}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${lead.score === 'Hot' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                      {lead.score}
                    </span>
                  </div>
                </div>
              ))}
              {leads.length === 0 && <p className="text-center text-slate-400 py-4 text-sm">No leads yet.</p>}
            </div>
          </div>
  
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800">Upcoming Meetings</h3>
              <Button variant="ghost" size="sm" className="text-indigo-600">View Calendar</Button>
            </div>
            <div className="space-y-4">
               {meetings.map(meeting => (
                 <div key={meeting.id} className="flex items-start gap-4 p-4 rounded-lg border-l-4 border-indigo-500 bg-indigo-50/30">
                   <div className="flex flex-col items-center justify-center min-w-[3rem] text-center">
                     <span className="text-xs font-bold text-slate-500 uppercase">{meeting.date}</span>
                     <span className="text-lg font-bold text-indigo-600">{meeting.time?.split(' ')[0]}</span>
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-800 text-sm">{meeting.title}</h4>
                     <p className="text-xs text-slate-500 mt-1">with {meeting.attendee}</p>
                     <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                       <div className={`w-2 h-2 rounded-full ${meeting.type === 'Zoom' ? 'bg-blue-400' : 'bg-green-400'}`}></div>
                       {meeting.type}
                     </div>
                   </div>
                 </div>
               ))}
               {meetings.length === 0 && <p className="text-center text-slate-400 py-4 text-sm">No meetings scheduled.</p>}
            </div>
          </div>
      </div>
    </div>
  );
};

const LeadsView = ({ leads }: { leads: Lead[] }) => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-slate-800">Leads Management</h2>
      <Button icon={<Plus className="w-4 h-4"/>}>Add Lead</Button>
    </div>

    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4">Last Contact</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{lead.name}</td>
                <td className="px-6 py-4 text-slate-500">{lead.company}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    lead.status === 'New' ? 'bg-blue-100 text-blue-700' :
                    lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-700' :
                    lead.status === 'Replied' ? 'bg-purple-100 text-purple-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 font-medium ${
                    lead.score === 'Hot' ? 'text-red-600' : 
                    lead.score === 'Warm' ? 'text-orange-500' : 'text-slate-500'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      lead.score === 'Hot' ? 'bg-red-500 animate-pulse' : 
                      lead.score === 'Warm' ? 'bg-orange-500' : 'bg-slate-400'
                    }`}></div>
                    {lead.score}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{lead.lastContact}</td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const InboxView = ({ selectedLead, messages, onSendMessage }: any) => {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleGenerateReply = async () => {
    setIsGenerating(true);
    try {
      // Analyze intent of last message first
      const lastMsg = messages[messages.length - 1];
      const intent = lastMsg ? await analyzeLeadIntent(lastMsg.content) : "General inquiry";
      
      const reply = await generateReply(selectedLead, messages, intent);
      setInputText(reply);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
      {/* Sidebar List (Simplified) */}
      <div className="w-80 border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
            <div className="p-4 bg-indigo-50/50 border-l-4 border-indigo-500 cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-slate-800 text-sm">{selectedLead?.name}</h4>
                    <span className="text-[10px] text-slate-500">Now</span>
                </div>
                <p className="text-xs text-slate-600 truncate">Last message content...</p>
            </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    {selectedLead?.name.charAt(0)}
                  </div>
                  <div>
                      <h3 className="font-bold text-slate-800 text-sm">{selectedLead?.name}</h3>
                      <p className="text-xs text-slate-500">{selectedLead?.role} at {selectedLead?.company}</p>
                  </div>
              </div>
              <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={<Phone className="w-3 h-3"/>}>Call</Button>
                  <Button variant="outline" size="sm" icon={<Calendar className="w-3 h-3"/>}>Schedule</Button>
              </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
             {messages.map((msg: Message) => (
                 <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[80%] md:max-w-[60%] rounded-2xl p-4 shadow-sm ${
                         msg.sender === 'user' 
                         ? 'bg-indigo-600 text-white rounded-br-sm' 
                         : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                     }`}>
                         <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                         <p className={`text-[10px] mt-2 ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                             {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {msg.channel}
                         </p>
                     </div>
                 </div>
             ))}
             <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-200 bg-white space-y-3">
              {/* AI Tools */}
              <div className="flex gap-2">
                  <button 
                      onClick={handleGenerateReply}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                      <Sparkles className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                      {isGenerating ? 'Analyzing & Drafting...' : 'Generate AI Reply'}
                  </button>
              </div>
              
              <div className="flex gap-3">
                  <input 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (onSendMessage(inputText), setInputText(''))}
                      placeholder="Type a message..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                  <Button 
                      onClick={() => { onSendMessage(inputText); setInputText(''); }}
                      disabled={!inputText.trim()}
                      className="rounded-xl px-6"
                      icon={<Send className="w-4 h-4" />}
                  />
              </div>
          </div>
      </div>
    </div>
  );
};

const App = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [view, setView] = useState<string>('home'); // public views + auth views + dashboard views
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [initializing, setInitializing] = useState(true);
  
  // Integration State
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [emailConnected, setEmailConnected] = useState(false);

  // Real Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversation, setConversation] = useState<Message[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const s = await getCurrentSession();
        if (s) {
          setSession(s);
          setView('dashboard');
        }
      } catch (e) {
        console.error("Session check failed", e);
      } finally {
        setInitializing(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (session && (view === 'leads' || view === 'inbox') && leads.length === 0) {
      fetchLeads().then(setLeads).catch(console.error);
    }
  }, [session, view, leads.length]);

  useEffect(() => {
    if (session && view === 'inbox' && leads.length > 0) {
      fetchMessages(leads[0].id).then(setConversation).catch(console.error);
    }
  }, [session, view, leads.length]);

  const handleLogin = () => setView('login');
  const handleSignup = () => setView('signup');
  
  const handleAuthSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await logout();
    setSession(null);
    setView('home');
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !leads[0]) return;
    try {
      const newMsg = await sendMessage({
        lead_id: leads[0].id,
        sender: 'user',
        content: text,
        channel: 'LinkedIn'
      });
      setConversation([...conversation, newMsg]);
    } catch (e) {
      console.error("Error sending message", e);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  // View Router
  const renderView = () => {
    // Public Views
    if (!session) {
      if (view === 'login') return <AuthScreen onAuthSuccess={handleAuthSuccess} onBack={() => setView('home')} initialMode="login" />;
      if (view === 'signup') return <AuthScreen onAuthSuccess={handleAuthSuccess} onBack={() => setView('home')} initialMode="signup" />;
      
      return (
        <PublicLayout onLogin={handleLogin} onSignup={handleSignup} currentView={view as PublicViewType} onNavigate={setView}>
          <HomeView onSignup={handleSignup} onNavigate={setView} />
          <FeaturesPage />
          <HowItWorksPage />
          <PricingPage onSignup={handleSignup} />
          <AboutPage />
          <ContactPage />
        </PublicLayout>
      );
    }

    // Dashboard Views
    const dashboardContent = () => {
      switch (view) {
        case 'dashboard': return <DashboardView session={session} whatsappConnected={whatsappConnected} emailConnected={emailConnected} />;
        case 'leads': return <LeadsView leads={leads} />;
        case 'inbox': return <InboxView selectedLead={leads[0]} messages={conversation} onSendMessage={handleSendMessage} />;
        case 'whatsapp': return <WhatsAppIntegration connected={whatsappConnected} onConnect={() => setWhatsappConnected(true)} onDisconnect={() => setWhatsappConnected(false)} />;
        case 'email': return <EmailIntegration connected={emailConnected} onConnect={() => setEmailConnected(true)} />;
        case 'meetings': return <PlaceholderView title="Meetings & Calendar" icon={Calendar} />;
        case 'deals': return <PlaceholderView title="Deals Pipeline" icon={BarChart3} />;
        case 'automation': return <PlaceholderView title="Automation Workflows" icon={Zap} />;
        case 'analytics': return <PlaceholderView title="Analytics & Reports" icon={PieChart} />;
        case 'settings': return <PlaceholderView title="Settings" icon={Settings} />;
        default: return <DashboardView session={session} whatsappConnected={whatsappConnected} emailConnected={emailConnected} />;
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar 
          currentView={view} 
          onChangeView={setView} 
          onLogout={handleLogout} 
          user={session.user} 
          whatsappConnected={whatsappConnected}
          emailConnected={emailConnected}
        />
        <MobileDrawer 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
          currentView={view} 
          onChangeView={setView} 
          onLogout={handleLogout} 
          user={session.user} 
        />
        
        <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 max-w-[1600px] mx-auto w-full">
           {/* Mobile Header */}
           <div className="md:hidden flex items-center justify-between mb-6">
             <div className="flex items-center gap-2 font-display font-bold text-lg text-slate-800">
                <Briefcase className="w-6 h-6 text-indigo-600"/> SalesAI
             </div>
             <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600">
               <Menu className="w-5 h-5" />
             </button>
           </div>
           
           {dashboardContent()}
        </main>
        
        <MobileBottomNav currentView={view} onChangeView={setView} />
      </div>
    );
  };

  return renderView();
};

export default App;