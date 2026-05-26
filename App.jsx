import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardPlus,
  GraduationCap,
  NotebookPen,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";

const STORAGE_KEY = "past-paper-tracker-data";

const emptyPaper = {
  subjectId: "",
  year: new Date().getFullYear().toString(),
  type: "Past Paper",
  marks: "",
  totalMarks: "100",
  weakLessons: "",
  notes: "",
};

function getStoredSubjects() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function percentage(paper) {
  const marks = Number(paper.marks);
  const total = Number(paper.totalMarks);
  if (!total) return 0;
  return Math.round((marks / total) * 1000) / 10;
}

function averageFor(subject) {
  if (!subject.papers.length) return null;
  const total = subject.papers.reduce((sum, paper) => sum + percentage(paper), 0);
  return Math.round((total / subject.papers.length) * 10) / 10;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function App() {
  const [subjects, setSubjects] = useState(getStoredSubjects);
  const [subjectName, setSubjectName] = useState("");
  const [paperForm, setPaperForm] = useState(emptyPaper);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    if (!paperForm.subjectId && subjects[0]) {
      setPaperForm((form) => ({ ...form, subjectId: subjects[0].id }));
    }
  }, [paperForm.subjectId, subjects]);

  const subjectStats = useMemo(
    () =>
      subjects.map((subject) => ({
        ...subject,
        average: averageFor(subject),
      })),
    [subjects],
  );

  const strongest = useMemo(
    () =>
      subjectStats
        .filter((subject) => subject.average !== null)
        .sort((a, b) => b.average - a.average)[0],
    [subjectStats],
  );

  const weakest = useMemo(
    () =>
      subjectStats
        .filter((subject) => subject.average !== null)
        .sort((a, b) => a.average - b.average)[0],
    [subjectStats],
  );

  const allPapers = useMemo(
    () =>
      subjects
        .flatMap((subject) =>
          subject.papers.map((paper) => ({
            ...paper,
            subjectName: subject.name,
            subjectId: subject.id,
          })),
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [subjects],
  );

  const recentPapers = allPapers.slice(0, 5);

  const improvementData = useMemo(
    () =>
      [...allPapers]
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(-8),
    [allPapers],
  );

  const improvementChange =
    improvementData.length > 1
      ? percentage(improvementData[improvementData.length - 1]) - percentage(improvementData[0])
      : 0;

  function addSubject(event) {
    event.preventDefault();
    const name = subjectName.trim();
    if (!name) return;

    const newSubject = {
      id: createId(),
      name,
      papers: [],
    };

    setSubjects((current) => [...current, newSubject]);
    setPaperForm((form) => ({ ...form, subjectId: form.subjectId || newSubject.id }));
    setSubjectName("");
  }

  function addPaper(event) {
    event.preventDefault();
    const marks = Number(paperForm.marks);
    const totalMarks = Number(paperForm.totalMarks);

    if (!paperForm.subjectId || Number.isNaN(marks) || Number.isNaN(totalMarks) || totalMarks <= 0) {
      return;
    }

    const paper = {
      id: createId(),
      year: paperForm.year.trim(),
      type: paperForm.type.trim() || "Past Paper",
      marks,
      totalMarks,
      weakLessons: paperForm.weakLessons.trim(),
      notes: paperForm.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    setSubjects((current) =>
      current.map((subject) =>
        subject.id === paperForm.subjectId
          ? { ...subject, papers: [...subject.papers, paper] }
          : subject,
      ),
    );

    setPaperForm((form) => ({
      ...emptyPaper,
      subjectId: form.subjectId,
      year: new Date().getFullYear().toString(),
    }));
  }

  function deletePaper(subjectId, paperId) {
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === subjectId
          ? { ...subject, papers: subject.papers.filter((paper) => paper.id !== paperId) }
          : subject,
      ),
    );
  }

  function deleteSubject(subjectId) {
    setSubjects((current) => current.filter((subject) => subject.id !== subjectId));
    setPaperForm((form) => ({
      ...form,
      subjectId: form.subjectId === subjectId ? "" : form.subjectId,
    }));
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">
            <GraduationCap size={16} aria-hidden="true" />
            Study progress dashboard
          </p>
          <h1>Past Paper Tracker</h1>
          <p>
            Record marks, spot weak lessons, and keep a calm view of your progress across every
            subject.
          </p>
        </div>

        <div className="hero-stats" aria-label="Tracker summary">
          <SummaryMetric label="Subjects" value={subjects.length} icon={<BookOpen />} />
          <SummaryMetric label="Papers" value={allPapers.length} icon={<NotebookPen />} />
          <SummaryMetric
            label="Latest score"
            value={recentPapers[0] ? `${percentage(recentPapers[0])}%` : "--"}
            icon={<Target />}
          />
        </div>
      </section>

      <section className="insight-grid" aria-label="Performance insights">
        <InsightCard
          title="Strongest subject"
          value={strongest ? strongest.name : "Add papers"}
          detail={strongest ? `${strongest.average}% average` : "Scores will appear here."}
          icon={<TrendingUp />}
        />
        <InsightCard
          title="Weakest subject"
          value={weakest ? weakest.name : "Add papers"}
          detail={weakest ? `${weakest.average}% average` : "Track papers to find gaps."}
          icon={<Target />}
        />
        <InsightCard
          title="Improvement"
          value={`${improvementChange > 0 ? "+" : ""}${Math.round(improvementChange * 10) / 10}%`}
          detail="First to latest recent paper"
          icon={<BarChart3 />}
        />
      </section>

      <section className="workspace-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Add data</p>
              <h2>Subjects and papers</h2>
            </div>
            <ClipboardPlus aria-hidden="true" />
          </div>

          <form className="subject-form" onSubmit={addSubject}>
            <label>
              Subject name
              <input
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
                placeholder="e.g. History"
              />
            </label>
            <button type="submit">
              <Plus size={18} aria-hidden="true" />
              Add
            </button>
          </form>

          <form className="paper-form" onSubmit={addPaper}>
            <label>
              Subject
              <select
                value={paperForm.subjectId}
                onChange={(event) =>
                  setPaperForm((form) => ({ ...form, subjectId: event.target.value }))
                }
              >
                {subjects.length ? (
                  subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))
                ) : (
                  <option value="">Add a subject first</option>
                )}
              </select>
            </label>

            <div className="form-row">
              <label>
                Year
                <input
                  value={paperForm.year}
                  onChange={(event) =>
                    setPaperForm((form) => ({ ...form, year: event.target.value }))
                  }
                  inputMode="numeric"
                />
              </label>
              <label>
                Type
                <input
                  value={paperForm.type}
                  onChange={(event) =>
                    setPaperForm((form) => ({ ...form, type: event.target.value }))
                  }
                  placeholder="Term / Model / Past"
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Marks
                <input
                  value={paperForm.marks}
                  onChange={(event) =>
                    setPaperForm((form) => ({ ...form, marks: event.target.value }))
                  }
                  min="0"
                  type="number"
                  required
                />
              </label>
              <label>
                Total
                <input
                  value={paperForm.totalMarks}
                  onChange={(event) =>
                    setPaperForm((form) => ({ ...form, totalMarks: event.target.value }))
                  }
                  min="1"
                  type="number"
                  required
                />
              </label>
            </div>

            <label>
              Weak lessons
              <textarea
                value={paperForm.weakLessons}
                onChange={(event) =>
                  setPaperForm((form) => ({ ...form, weakLessons: event.target.value }))
                }
                placeholder="Lessons or chapters to revise"
              />
            </label>

            <label>
              Mistake notes
              <textarea
                value={paperForm.notes}
                onChange={(event) =>
                  setPaperForm((form) => ({ ...form, notes: event.target.value }))
                }
                placeholder="What went wrong? What should change next time?"
              />
            </label>

            <button className="primary-action" type="submit" disabled={!subjects.length}>
              <Plus size={18} aria-hidden="true" />
              Save paper
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Progress</p>
              <h2>Improvement over time</h2>
            </div>
            <CalendarDays aria-hidden="true" />
          </div>

          <div className="chart" aria-label="Recent score percentages">
            {improvementData.length ? (
              improvementData.map((paper) => (
                <div className="chart-item" key={paper.id}>
                  <div className="bar-track">
                    <span style={{ height: `${Math.max(percentage(paper), 6)}%` }} />
                  </div>
                  <small>{Math.round(percentage(paper))}%</small>
                </div>
              ))
            ) : (
              <p className="empty-state">Add papers to see your score trend.</p>
            )}
          </div>

          <div className="recent-list">
            <h3>Recent papers</h3>
            {recentPapers.length ? (
              recentPapers.map((paper) => (
                <article className="paper-row" key={paper.id}>
                  <div>
                    <strong>{paper.subjectName}</strong>
                    <span>
                      {paper.year} {paper.type} - {formatDate(paper.createdAt)}
                    </span>
                  </div>
                  <b>{percentage(paper)}%</b>
                </article>
              ))
            ) : (
              <p className="empty-state">No papers saved yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="subjects-section">
        <div className="section-title">
          <p className="eyebrow">Subject overview</p>
          <h2>Average marks per subject</h2>
        </div>

        <div className="subject-grid">
          {subjectStats.length ? (
            subjectStats.map((subject) => (
              <article className="subject-card" key={subject.id}>
              <div className="subject-card-head">
                <div>
                  <h3>{subject.name}</h3>
                  <p>{subject.papers.length} saved paper{subject.papers.length === 1 ? "" : "s"}</p>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => deleteSubject(subject.id)}
                  aria-label={`Delete ${subject.name}`}
                  title={`Delete ${subject.name}`}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="average-meter">
                <div>
                  <span style={{ width: `${subject.average ?? 0}%` }} />
                </div>
                <strong>{subject.average ?? "--"}%</strong>
              </div>

              <div className="paper-stack">
                {subject.papers.length ? (
                  [...subject.papers].reverse().map((paper) => (
                    <article className="paper-card" key={paper.id}>
                      <div className="paper-card-top">
                        <div>
                          <strong>
                            {paper.year} {paper.type}
                          </strong>
                          <span>
                            {paper.marks}/{paper.totalMarks} - {percentage(paper)}%
                          </span>
                        </div>
                        <button
                          className="icon-button"
                          type="button"
                          onClick={() => deletePaper(subject.id, paper.id)}
                          aria-label={`Delete ${paper.year} ${paper.type}`}
                          title="Delete paper"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                      {paper.weakLessons && (
                        <p>
                          <b>Weak lessons:</b> {paper.weakLessons}
                        </p>
                      )}
                      {paper.notes && (
                        <p>
                          <b>Mistakes:</b> {paper.notes}
                        </p>
                      )}
                    </article>
                  ))
                ) : (
                  <p className="empty-state">No papers for this subject yet.</p>
                )}
              </div>
              </article>
            ))
          ) : (
            <p className="empty-state wide-empty">Add your first subject to begin tracking papers.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function SummaryMetric({ label, value, icon }) {
  return (
    <div className="summary-metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InsightCard({ title, value, detail, icon }) {
  return (
    <article className="insight-card">
      <div className="insight-icon">{icon}</div>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
