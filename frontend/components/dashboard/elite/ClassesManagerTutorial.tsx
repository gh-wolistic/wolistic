"use client";

import { Step } from "react-joyride";

export const classesManagerTutorialSteps: Step[] = [
  {
    target: "body",
    content: (
      <div className="space-y-4" style={{ color: '#FAFAFA' }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎉</span>
          <h3 className="text-xl font-bold" style={{ color: '#FFFFFF' }}>Welcome to Classes Manager!</h3>
        </div>
        <p className="text-base leading-relaxed" style={{ color: '#F4F4F5' }}>
          This tutorial will guide you through creating group fitness classes, scheduling sessions, 
          and managing enrollments. Let's get started!
        </p>
        <p className="text-sm rounded-lg px-3 py-2 border" style={{ color: '#A1A1AA', backgroundColor: 'rgba(24, 24, 27, 0.5)', borderColor: '#3F3F46' }}>
          💡 Tip: You can exit this tutorial anytime by pressing <kbd className="px-2 py-0.5 rounded border text-xs font-mono" style={{ backgroundColor: '#27272A', borderColor: '#52525B', color: '#D4D4D8' }}>ESC</kbd> or clicking "Skip".
        </p>
      </div>
    ),
    placement: "center",
    skipBeacon: true,
  },
  {
    target: ".tutorial-create-class-button",
    content: (
      <div className="space-y-3">
        <h4 className="font-bold text-white text-lg">Step 1: Create a Class Template</h4>
        <p className="text-base text-zinc-100 leading-relaxed">
          Click here to create your first class template. A class template is the blueprint 
          for recurring sessions (e.g., "Morning Yoga", "HIIT Training").
        </p>
        <div className="bg-amber-500/10 rounded-lg px-4 py-3 border border-amber-500/30">
          <p className="text-sm text-amber-300">
            💡 You'll define: title, category, duration, capacity, price, and location.
          </p>
        </div>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: ".tutorial-stats-section",
    content: (
      <div className="space-y-3">
        <h4 className="font-bold text-white text-lg">Quick Stats Overview</h4>
        <p className="text-base text-zinc-100 leading-relaxed">
          Monitor your active classes, upcoming sessions, and total enrollments at a glance.
        </p>
        <p className="text-sm text-zinc-300">
          📊 These metrics update in real-time as you create classes and clients enroll.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: ".tutorial-detailed-list",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-white">Detailed Class List</h4>
        <p className="text-sm text-zinc-300">
          This table shows all your classes with complete details. Click on any class name 
          to expand and see all its sessions.
        </p>
        <p className="text-xs text-emerald-400">
          ✨ Try clicking a class name to see the expandable sessions feature!
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: "body",
    content: (
      <div className="space-y-3">
        <h4 className="font-semibold text-white">Understanding Session Status</h4>
        <div className="space-y-2 text-sm text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-zinc-500/20 text-zinc-400 rounded text-xs">Draft</span>
            <span>Not visible to clients yet (you can edit freely)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">Published</span>
            <span>Visible to clients (locked if has enrollments)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-rose-500/20 text-rose-400 rounded text-xs">Cancelled</span>
            <span>Session cancelled (refunds processed)</span>
          </div>
        </div>
      </div>
    ),
    placement: "center",
  },
  {
    target: "body",
    content: (
      <div className="space-y-4">
        <h4 className="font-bold text-white text-lg">Creating Sessions</h4>
        <p className="text-base text-zinc-100 leading-relaxed">
          Once you have a class template, you can add sessions in two ways:
        </p>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-white font-bold text-lg">1.</span>
            <div>
              <strong className="text-white">Single Session:</strong>
              <p className="text-sm text-zinc-200 mt-1">Create one session at a time for specific dates</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-white font-bold text-lg">2.</span>
            <div>
              <strong className="text-white">Bulk Sessions:</strong>
              <p className="text-sm text-zinc-200 mt-1">Create multiple recurring sessions with daily/weekly patterns</p>
            </div>
          </li>
        </ol>
        <div className="bg-emerald-500/10 rounded-lg px-4 py-3 border border-emerald-500/30">
          <p className="text-sm text-emerald-300">
            💡 Sessions start as "Draft" - they won't appear to clients until you publish them.
          </p>
        </div>
      </div>
    ),
    placement: "center",
  },
  {
    target: "body",
    content: (
      <div className="space-y-4">
        <div className="flex items-center gap-2 bg-amber-500/10 rounded-lg px-4 py-3 border border-amber-500/30">
          <span className="text-2xl">⚠️</span>
          <h4 className="font-bold text-amber-400 text-lg">Publishing Sessions (Critical!)</h4>
        </div>
        <p className="text-base text-zinc-100 leading-relaxed">
          When you publish a session, it becomes visible to clients. After publishing:
        </p>
        <ul className="space-y-2.5">
          <li className="flex items-start gap-2 text-zinc-100">
            <span className="text-rose-400 mt-0.5">🔒</span>
            <span className="text-sm">Date, time, and location become <strong className="text-white">permanently locked</strong></span>
          </li>
          <li className="flex items-start gap-2 text-zinc-100">
            <span className="text-rose-400 mt-0.5">❌</span>
            <span className="text-sm">Once someone enrolls, you <strong className="text-white">cannot change</strong> these details</span>
          </li>
          <li className="flex items-start gap-2 text-zinc-100">
            <span className="text-emerald-400 mt-0.5">🛡️</span>
            <span className="text-sm">This protects client trust (they booked based on specific date/time)</span>
          </li>
        </ul>
        <div className="bg-rose-500/10 rounded-lg px-4 py-3 border border-rose-500/30">
          <p className="text-sm text-rose-300 font-medium">
            💡 Pro Tip: Always double-check date, time, location, and price before publishing!
          </p>
        </div>
      </div>
    ),
    placement: "center",
  },
  {
    target: "body",
    content: (
      <div className="space-y-4">
        <h4 className="font-bold text-white text-lg">Deleting vs Cancelling Sessions</h4>
        <div className="space-y-3">
          <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🗑️</span>
              <div className="space-y-1">
                <strong className="text-white text-base">Delete</strong>
                <p className="text-sm text-zinc-200">
                  Removes draft sessions or published sessions <strong className="text-emerald-300">without enrollments</strong>. 
                  No refunds needed - safe to delete anytime.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-rose-500/10 rounded-lg border border-rose-500/30">
            <div className="flex items-start gap-3">
              <span className="text-2xl">❌</span>
              <div className="space-y-1">
                <strong className="text-white text-base">Cancel</strong>
                <p className="text-sm text-zinc-200">
                  Required when session has enrollments. Automatically triggers <strong className="text-rose-300">refunds to all clients</strong> 
                  and impacts your reliability score.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg px-4 py-3 border border-zinc-700">
          <p className="text-sm text-zinc-300">
            💡 Published sessions with enrollments show a "Locked" 🔒 indicator - they cannot be deleted, only cancelled.
          </p>
        </div>
      </div>
    ),
    placement: "center",
  },
  {
    target: ".tutorial-tabs",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-white">Navigation Tabs</h4>
        <ul className="space-y-1 text-sm text-zinc-300">
          <li><strong>Schedule Overview:</strong> See your next upcoming session</li>
          <li><strong>My Classes:</strong> Manage all your class templates and sessions</li>
          <li><strong>Enrollments:</strong> View all client bookings and mark attendance</li>
        </ul>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: "body",
    content: (
      <div className="space-y-4">
        <h4 className="font-bold text-white text-lg">📋 Working with "My Classes" Tab</h4>
        <p className="text-base text-zinc-100 leading-relaxed">
          Let's explore the "My Classes" tab where you'll spend most of your time managing classes and sessions.
        </p>
        <div className="bg-sky-500/10 rounded-lg px-4 py-3 border border-sky-500/30">
          <p className="text-sm text-sky-300">
            💡 Click on "My Classes" tab now to see your class list (if you haven't already).
          </p>
        </div>
      </div>
    ),
    placement: "center",
  },
  {
    target: ".tutorial-expand-class",
    content: (
      <div className="space-y-4">
        <h4 className="font-bold text-white text-lg">Understanding Class Actions</h4>
        <p className="text-base text-zinc-100 leading-relaxed">
          Each class row has action icons on the right side:
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">👁️</span>
            <div>
              <strong className="text-white">View Enrollments</strong>
              <p className="text-sm text-zinc-200 mt-1">Click the eye icon to see all client bookings</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <strong className="text-white">Add Sessions</strong>
              <p className="text-sm text-zinc-200 mt-1">Click the calendar icon to create new sessions (single or bulk)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">✏️</span>
            <div>
              <strong className="text-white">Edit Class</strong>
              <p className="text-sm text-zinc-200 mt-1">Click the edit icon to modify class template details</p>
            </div>
          </div>
        </div>
        <div className="bg-emerald-500/10 rounded-lg px-4 py-3 border border-emerald-500/30">
          <p className="text-sm text-emerald-300">
            ✨ <strong>Pro Tip:</strong> Click this class name (on the left) to expand/collapse and see all sessions!
          </p>
        </div>
      </div>
    ),
    placement: "right",
  },
  {
    target: ".tutorial-add-session",
    content: (
      <div className="space-y-4">
        <h4 className="font-bold text-white text-lg">📅 Adding Sessions to a Class</h4>
        <p className="text-base text-zinc-100 leading-relaxed">
          Click this <strong className="text-emerald-400">📅 calendar icon</strong> to add sessions to your class.
        </p>
        <div className="space-y-3">
          <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/30">
            <strong className="text-violet-300">Option 1: Single Session</strong>
            <p className="text-sm text-zinc-200 mt-1">
              Perfect for one-time workshops or special events. Pick a specific date and time.
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
            <strong className="text-emerald-300">Option 2: Bulk Sessions (Recommended!)</strong>
            <p className="text-sm text-zinc-200 mt-1">
              Create multiple sessions at once with daily/weekly patterns. Great for recurring classes!
            </p>
          </div>
        </div>
        <div className="bg-amber-500/10 rounded-lg px-4 py-3 border border-amber-500/30">
          <p className="text-sm text-amber-300">
            💡 Bulk creation saves time: Create "Every Monday @ 6 PM for 4 weeks" in seconds!
          </p>
        </div>
      </div>
    ),
    placement: "left",
  },
  {
    target: "body",
    content: (
      <div className="space-y-4">
        <h4 className="font-bold text-white text-lg">👁️ Viewing Session Details</h4>
        <p className="text-base text-zinc-100 leading-relaxed">
          When you expand a class (click the eye icon 👁️), you'll see all its sessions in a nested view:
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-zinc-200">
            <span className="text-emerald-400">●</span>
            <span><strong>Date & Time:</strong> When the session happens</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-200">
            <span className="text-sky-400">●</span>
            <span><strong>Enrollments:</strong> How many clients booked (e.g., "5/20")</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-200">
            <span className="text-violet-400">●</span>
            <span><strong>Status Badge:</strong> Draft, Published, or Cancelled</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-200">
            <span className="text-amber-400">●</span>
            <span><strong>Actions:</strong> Publish, Edit, Delete, or View Enrollments</span>
          </div>
        </div>
        <div className="bg-zinc-800/50 rounded-lg px-4 py-3 border border-zinc-700">
          <p className="text-sm text-zinc-300">
            💡 Sessions with enrollments show a "Locked" 🔒 icon - you can't edit date/time/location!
          </p>
        </div>
      </div>
    ),
    placement: "center",
  },
  {
    target: "body",
    content: (
      <div className="space-y-4">
        <h4 className="font-bold text-white text-lg">✅ Publishing Sessions</h4>
        <p className="text-base text-zinc-100 leading-relaxed">
          Draft sessions are invisible to clients. To make them bookable, you need to publish them:
        </p>
        <ol className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-white font-bold text-lg">1.</span>
            <div>
              <p className="text-sm text-zinc-200">Expand a class to see its sessions</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-white font-bold text-lg">2.</span>
            <div>
              <p className="text-sm text-zinc-200">Find a session with "Draft" badge</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-white font-bold text-lg">3.</span>
            <div>
              <p className="text-sm text-zinc-200">Click the "Publish" button in the Actions column</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-white font-bold text-lg">4.</span>
            <div>
              <p className="text-sm text-zinc-200">Review the warning modal and confirm</p>
            </div>
          </li>
        </ol>
        <div className="bg-rose-500/10 rounded-lg px-4 py-3 border border-rose-500/30">
          <p className="text-sm text-rose-300 font-medium">
            ⚠️ Remember: Publishing locks the date/time/location. Double-check before confirming!
          </p>
        </div>
      </div>
    ),
    placement: "center",
  },
  {
    target: "body",
    content: (
      <div className="space-y-3">
        <h4 className="font-semibold text-white">Class Expiry System</h4>
        <p className="text-sm text-zinc-300">
          Every class template has an expiry date (default: 3 months). This ensures you 
          periodically review pricing and schedules.
        </p>
        <p className="text-xs text-amber-400">
          ⚠️ You'll see warnings when a class is about to expire. You can renew it with updated details.
        </p>
      </div>
    ),
    placement: "center",
  },
  {
    target: "body",
    content: (
      <div className="space-y-3">
        <h4 className="font-semibold text-white">Pro Tips for Success 🚀</h4>
        <ul className="space-y-2 text-sm text-zinc-300">
          <li>✅ Create sessions 1-2 weeks in advance to give clients time to book</li>
          <li>✅ Use bulk creation for recurring weekly classes (saves time!)</li>
          <li>✅ Always review details before publishing (date/time become immutable)</li>
          <li>✅ Monitor the expiry warnings and renew classes before they expire</li>
          <li>✅ Use the expandable list view to quickly review all sessions</li>
        </ul>
      </div>
    ),
    placement: "center",
  },
  {
    target: "body",
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white">You're All Set! 🎊</h3>
        <p className="text-sm text-zinc-300">
          You now know how to create classes, schedule sessions, and manage enrollments. 
          Start creating your first class to see it in action!
        </p>
        <p className="text-xs text-zinc-400">
          You can restart this tutorial anytime from the help menu.
        </p>
      </div>
    ),
    placement: "center",
  },
];

export const tutorialStyles = {
  options: {
    arrowColor: "#18181B", // zinc-900
    backgroundColor: "#18181B", // zinc-900
    overlayColor: "rgba(0, 0, 0, 0.85)",
    primaryColor: "#10B981", // emerald-500
    textColor: "#FAFAFA", // zinc-50
    zIndex: 10000,
  },
  tooltip: {
    backgroundColor: "#18181B",
    color: "#FAFAFA",
    borderRadius: 16,
    padding: 24,
    border: "1px solid #3F3F46",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
  },
  tooltipContainer: {
    textAlign: "left" as const,
    backgroundColor: "#18181B",
  },
  tooltipContent: {
    padding: "4px 0",
    color: "#FAFAFA",
  },
  tooltipTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: 700,
  },
  tooltipFooter: {
    marginTop: 16,
  },
  buttonNext: {
    backgroundColor: "#10B981",
    color: "#FFFFFF",
    borderRadius: 8,
    fontSize: 15,
    padding: "12px 24px",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  buttonBack: {
    color: "#E4E4E7",
    marginRight: 12,
    fontSize: 15,
    fontWeight: 500,
    padding: "12px 20px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  buttonSkip: {
    color: "#E4E4E7",
    fontSize: 15,
    fontWeight: 500,
    padding: "12px 20px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
  },
  buttonClose: {
    display: "none",
  },
};
