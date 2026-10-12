import React from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import {
  HelpCircle,
  MessageCircle,
  Send,
  ShieldAlert,
  Clock,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const SupportPage: React.FC = () => {
  const { language, t } = useLanguage();

  const faqs = [
    {
      q: language === 'bn' ? 'উইথড্র করার কত সময়ের মধ্যে বিকাশ বা নগদে টাকা পাব?' : 'How long does withdrawal take to arrive?',
      a: language === 'bn'
        ? 'আমাদের অটোমেটেড সিস্টেমে সাধারণত ১ থেকে ৩ ঘণ্টার মধ্যে পেমেন্ট ক্লিয়ার হয়। সর্বোচ্চ ২৪ ঘণ্টার মধ্যে সকল ভেরিফায়েড পেমেন্ট নিশ্চিত করা হয়।'
        : 'Usually within 1 to 3 hours during active hours (10 AM - 10 PM BST). Maximum 24 hours.',
    },
    {
      q: language === 'bn' ? 'টাস্কের ১০ সেকেন্ডের এড গেট কেন বাধ্যতামূলক?' : 'Why is the 10-second sponsor gate mandatory?',
      a: language === 'bn'
        ? 'স্পনসররা বিজ্ঞাপন প্রদর্শনের মাধ্যমেই রিওয়ার্ড বাজেট সরবরাহ করে। এড বন্ধ বা স্কিপ করলে সার্ভার টাইমার স্বয়ংক্রিয়ভাবে বাতিল হয়ে যায়।'
        : 'Sponsors fund user rewards. The 10-second security gate ensures authentic verification before task execution.',
    },
    {
      q: language === 'bn' ? 'ভিপিএন (VPN) ব্যবহার করে কাজ করা যাবে কি?' : 'Can I use a VPN?',
      a: language === 'bn'
        ? 'না। ভিপিএন, মাল্টিপল ডুপ্লিকেট একাউন্ট বা অটো-ক্লিকার ব্যবহার করলে সিকিউরিটি সিস্টেমে একাউন্ট স্বয়ংক্রিয়ভাবে সাসপেন্ড হয়ে যাবে।'
        : 'No. Using proxies, VPNs, or multi-accounting violates platform fraud policies and leads to immediate suspension.',
    },
    {
      q: language === 'bn' ? 'রেফারেল বোনাস কিভাবে কার্যকর হয়?' : 'How does referral bonus work?',
      a: language === 'bn'
        ? 'আপনার রেফারেল লিংক দিয়ে কেউ একাউন্ট খুললে সাথে সাথে বোনাস পাবেন এবং সে ভবিষ্যতে যত টাস্ক সম্পন্ন করবে তার ১০% আজীবন কমিশন পাবেন।'
        : 'Instant bonus when an invited friend signs up, plus 10% lifetime commission on all their completed tasks.',
    },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto">
      {/* Title */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>{language === 'bn' ? '২৪/৭ গ্রাহক সেবা ও হেল্পলাইন' : 'Help & Support'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t.support}</h1>
        <p className="text-xs sm:text-sm text-slate-400">
          {language === 'bn'
            ? 'যেকোনো সমস্যা বা পেমেন্ট সংক্রান্ত তথ্যের জন্য আমাদের সাথে যোগাযোগ করুন।'
            : 'Get assistance from our dedicated Bangladesh support team.'}
        </p>
      </div>

      {/* Official Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Telegram */}
        <a
          href="https://t.me"
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-2xl border border-sky-500/30 bg-slate-900 p-5 hover:border-sky-400 transition-all shadow-lg flex items-start gap-4"
        >
          <div className="h-12 w-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Send className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors flex items-center gap-1.5">
              <span>{t.telegramChannel}</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {language === 'bn'
                ? 'প্রতিদিনের বিকাশ ও নগদ পেমেন্ট প্রুফ ও স্পেশাল কোড পেতে জয়েন করুন।'
                : 'Live payment proofs & promotional announcement updates.'}
            </p>
          </div>
        </a>

        {/* WhatsApp */}
        <a
          href="https://wa.me"
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-2xl border border-emerald-500/30 bg-slate-900 p-5 hover:border-emerald-400 transition-all shadow-lg flex items-start gap-4"
        >
          <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
              <span>{t.whatsappSupport}</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {language === 'bn'
                ? 'সরাসরি হেল্পলাইন এজেন্টের সাথে চ্যাট করে দ্রুত সমাধান নিন।'
                : 'Chat directly with support representatives.'}
            </p>
          </div>
        </a>
      </div>

      {/* Security notice */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-300 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <span className="font-bold block">সতর্কবার্তা ও নিরাপত্তা নির্দেশিকা:</span>
          <p className="mt-0.5 text-[11px] text-amber-200/80 leading-relaxed">
            টাকাআর্ন বিডি কখনোই আপনার একাউন্টের পাসওয়ার্ড বা পিন নম্বর জানতে চাইবে না। কোনো অননুমোদিত ব্যক্তির সাথে আপনার ওটিপি (OTP) বা পাসওয়ার্ড শেয়ার করবেন না।
          </p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-white">
          {language === 'bn' ? 'সাধারণ জিজ্ঞাসাসমূহ (FAQ)' : 'Frequently Asked Questions'}
        </h3>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-800/80 bg-slate-950 p-4 space-y-1.5"
            >
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs text-slate-300 pl-5 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
