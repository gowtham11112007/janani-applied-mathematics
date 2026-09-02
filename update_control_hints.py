import re

with open('src/components/ControlRail.tsx', 'r') as f:
    content = f.read()

# Add a hint above the Room Delay section
room_hint = """
        {/* ROOM MODEL */}
        <div className="shrink-0 py-3">
          <SectionLabel icon={<Activity size={11} />} label="Actual Room (Echo Path)" />
          <p className="text-[10px] text-muted/70 mb-3 leading-snug px-1">
            <b>Hint:</b> Change these to simulate the physical room. The filter will have to adapt!
          </p>
          <div className="flex flex-col gap-2">
"""
content = content.replace('        {/* ROOM MODEL */}\n        <div className="shrink-0 py-3">\n          <SectionLabel icon={<Activity size={11} />} label="Actual Room (Echo Path)" />\n          <div className="flex flex-col gap-2">', room_hint.strip())

# Add a hint in the Estimator section
est_hint = """
        {/* ESTIMATION MODULE */}
        <div className="flex-1 flex flex-col py-3">
          <div className="flex items-center justify-between mb-2">
            <SectionLabel icon={<Wand2 size={11} />} label="Echo Estimator & Canceller" />
            <button
"""
content = content.replace('        {/* ESTIMATION MODULE */}\n        <div className="flex-1 flex flex-col py-3">\n          <div className="flex items-center justify-between mb-2">\n            <SectionLabel icon={<Wand2 size={11} />} label="Echo Estimator & Canceller" />\n            <button', est_hint.strip())

# Right under the toggle
toggle_hint = """
          <p className="text-[10px] text-muted/70 mb-3 leading-snug px-1 mt-2">
            <b>Hint:</b> The LMS algorithm continuously updates its coefficients to reduce the error.
          </p>
"""
content = re.sub(r'(<button\s+onClick=\{\(\) => setCancellerOn\(\!cancellerOn\)\}.*?</button>\n          </div>)', r'\1\n' + toggle_hint, content, flags=re.DOTALL)

with open('src/components/ControlRail.tsx', 'w') as f:
    f.write(content)
