"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LottiePlayer from "@/components/LottiePlayer";
import Link from "next/link";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBUPmtsWmM5tvFBDiloryBGgWBX9vIeU4w",
  authDomain: "uptura-leads.firebaseapp.com",
  projectId: "uptura-leads",
  storageBucket: "uptura-leads.firebasestorage.app",
  messagingSenderId: "146306181969",
  appId: "1:146306181969:web:c91b776edc33f652c2c170",
  measurementId: "G-ELHWMEHZ9W"
};

// Initialize Firebase once
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showHoverMe, setShowHoverMe] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !sidebarRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const sidebar = sidebarRef.current;
    let width: number, height: number;
    let particles: any[] = [];

    const resize = () => {
      const rect = sidebar.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      x: number; y: number; size: number; speedX: number; speedY: number; color: string; life: number;
      constructor(x: number, y: number) {
        this.x = x; this.y = y;
        this.size = Math.random() * 8 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 + 1;
        this.color = ['#FF3C00', '#1a1a1a', '#e0e0e0', '#FF5722'][Math.floor(Math.random() * 4)];
        this.life = 100;
      }
      update() { this.x += this.speedX; this.y += this.speedY; this.life--; this.size *= 0.96; }
      draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 100;
        ctx.beginPath();
        if (Math.random() > 0.5) ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        else ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) { particles.splice(i, 1); i--; }
      }
      requestAnimationFrame(animate);
    };
    animate();

    const handleMove = (e: MouseEvent) => {
      const rect = sidebar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      for(let i=0; i<3; i++) particles.push(new Particle(x, y));
      if(showHoverMe) setShowHoverMe(false);
    };
    
    const handleClick = (e: MouseEvent) => {
      const rect = sidebar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      for(let i=0; i<15; i++) particles.push(new Particle(x, y));
      setShowHoverMe(false);
    };

    sidebar.addEventListener('mousemove', handleMove);
    sidebar.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', resize);
      sidebar.removeEventListener('mousemove', handleMove);
      sidebar.removeEventListener('click', handleClick);
    };
  }, [showHoverMe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "leads"), {
        ...formData,
        createdAt: serverTimestamp(),
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Error adding document: ", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#EEE9E3] min-h-screen">
      <Navbar />
      <div className="contact-page-wrapper">
        <div ref={sidebarRef} className="contact-sidebar">
          <canvas ref={canvasRef} id="sidebar-canvas"></canvas>
          {showHoverMe && <div className="hover-me-text"></div>}
          <div className="sidebar-top">
            <div className="sidebar-content">
              <h2 className="sidebar-title">Book a call <br />with us</h2>
              <p className="sidebar-text">During this call we do a quick intro and discuss your project and its specific needs.</p>
            </div>
          </div>
          <div className="back-home-container">
            <Link href="/" className="sidebar-home-btn">
              ← Back to Home
            </Link>
          </div>
        </div>

        <div className="contact-content">
          <h1 className="contact-heading">Want to <span style={{ color: "#6B6763" }}>Collaborate?</span></h1>
          
          {submitted ? (
            <div className="success-message p-10 bg-white rounded-3xl shadow-sm border-2 border-black">
              <h2 className="text-4xl font-black mb-4">🚀 Success!</h2>
              <p className="text-xl font-bold text-gray-600">Your message has been received. We&apos;ll get back to you within 24 hours.</p>
              <button onClick={() => setSubmitted(false)} className="mt-8 font-black underline">Send another message</button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter your Name" 
                  required 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="Enter your Email" 
                  required 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter your Company Name"
                  value={formData.company}
                  onChange={e => setFormData({...formData, company: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Is there any other information you&apos;d like to share with us?</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Tell us your thoughts"
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>
              <button type="submit" className="submit-btn" disabled={submitting}>
                <div className={submitting ? "submit-spinner block" : "hidden"}></div>
                <span className="btn-text"><span>{submitting ? "Submitting..." : "Submit"}</span></span>
              </button>
            </form>
          )}

          <div className="contact-illustration mt-10">
            <LottiePlayer 
              src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/6962533fc2c9dd31ca443b61_16ad847094484d2cbcdcfbed32ad1a45.json"
              style={{ width: "250px", height: "auto" }}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
