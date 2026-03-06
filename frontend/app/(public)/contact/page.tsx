"use client";
import React, { useState } from "react";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Image from "next/image";
import logoImage from "@/assets/logo_ver.png";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/40" />
        <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/20" />
        <div className="absolute -bottom-12 left-10 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-500/20" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute top-6 -left-16 z-0 w-72 opacity-50 sm:top-8 sm:-left-20 sm:w-96 sm:opacity-50 lg:top-10 lg:-left-28 lg:w-152">
            <Image
              src={logoImage}
              alt=""
              className="h-auto w-full scale-85 origin-top-right"
            />
          </div>
          <div className="relative max-w-3xl mx-auto text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-sm text-emerald-700 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-200">
              Contact Wolistic
            </p>
            <h1 className="mt-6 text-4xl lg:text-5xl font-medium tracking-tight">We&apos;d love to hear from you</h1>
            <p className="mt-5 text-lg text-muted-foreground dark:text-slate-200/75">
              Questions, feedback, or partnership inquiries—our team is here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-12 lg:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl border border-border p-8 shadow-sm dark:bg-slate-950/60 dark:border-slate-800">
              <h2 className="text-3xl lg:text-4xl mb-2">Send us a message</h2>
              <p className="text-muted-foreground mb-8 dark:text-slate-200/70">
                Tell us what you&apos;re looking for and we&apos;ll connect you with the right team.
              </p>
              <form onSubmit={handleSubmit} className="space-y-6" aria-describedby="contact-form-note">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="you@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    placeholder="How can we help?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    placeholder="Tell us more about your goals or questions..."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-linear-to-r from-emerald-500 to-teal-600 text-white"
                >
                  <Send size={16} className="mr-2" />
                  Send Message
                </Button>
                <p id="contact-form-note" className="text-xs text-muted-foreground dark:text-slate-200/70">
                  By submitting, you agree to our team reaching out via email. We never share your information.
                </p>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl lg:text-4xl mb-6">Contact information</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-linear-to-br from-emerald-100 to-teal-100 flex items-center justify-center shrink-0 dark:from-emerald-500/20 dark:to-teal-500/20">
                      <Mail size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-lg font-medium">Email</h3>
                      <a className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200" href="mailto:hello@wolistic.com">
                        hello@wolistic.com
                      </a>
                      <p className="text-sm text-muted-foreground mt-1 dark:text-slate-200/70">We respond within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-linear-to-br from-teal-100 to-cyan-100 flex items-center justify-center shrink-0 dark:from-teal-500/20 dark:to-cyan-500/20">
                      <Phone size={24} className="text-teal-600" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-lg font-medium">Phone</h3>
                      <p className="text-muted-foreground dark:text-slate-200/70">+1 (555) 845-1122</p>
                      <p className="text-sm text-muted-foreground mt-1 dark:text-slate-200/70">Mon–Fri, 9am–6pm</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-linear-to-br from-cyan-100 to-blue-100 flex items-center justify-center shrink-0 dark:from-cyan-500/20 dark:to-blue-500/20">
                      <MapPin size={24} className="text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-lg font-medium">Location</h3>
                      <p className="text-muted-foreground dark:text-slate-200/70">141 Wellness Way, Suite 120, San Francisco, CA</p>
                      <a className="text-sm text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200" href="https://maps.google.com" target="_blank" rel="noreferrer">
                        Get directions
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0 dark:from-blue-500/20 dark:to-indigo-500/20">
                      <Clock size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-lg font-medium">Office hours</h3>
                      <p className="text-muted-foreground dark:text-slate-200/70">Monday – Friday: 9:00am – 6:00pm</p>
                      <p className="text-muted-foreground dark:text-slate-200/70">Saturday: 10:00am – 2:00pm</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-accent/50 rounded-2xl p-8 border border-border dark:bg-slate-900/60 dark:border-slate-800">
                <h3 className="mb-4 text-lg font-medium">Partnership inquiries</h3>
                <p className="text-muted-foreground mb-4 dark:text-slate-200/70">
                  Interested in becoming a Wolistic partner? We&apos;d love to hear from you.
                </p>
                <p className="text-sm text-muted-foreground dark:text-slate-200/70">
                  Mention “Partnership” in the subject line or email us directly at
                  <a className="ml-1 text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200" href="mailto:partners@wolistic.com">
                    partners@wolistic.com
                  </a>
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 dark:bg-emerald-500/10 dark:border-emerald-500/30">
                <h3 className="mb-4 text-lg font-medium">For wellness seekers</h3>
                <p className="text-muted-foreground dark:text-slate-200/70">
                  Have questions about finding the right professional or using the platform?
                  Our support team is ready to help you on your wellness journey.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
