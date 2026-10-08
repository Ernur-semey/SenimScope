"use client";

import { useEffect, useRef, useState } from "react";
import { ClusterSelect } from "./components/cluster-select";
import { WalletButton } from "./components/wallet-button";
import { WalletAuthControl } from "./components/wallet-auth-control";
import { createSeedProject, type DemoProject } from "./lib/project-types";
import type { ScopeAssessment } from "./lib/scope-analysis";
import { useWalletSession } from "./lib/wallet-session-context";

type SaveState = "loading" | "saving" | "saved" | "error";
const isPublicPreview = process.env.NODE_ENV === "production";

function addActivity(project: DemoProject, actor: string, action: string): DemoProject["activity"] {
  return [{ id: `activity-${crypto.randomUUID()}`, actor, action, dateLabel: "сейчас" }, ...project.activity].slice(0, 12);
}

function classificationLabel(assessment: ScopeAssessment | null) {
  if (!assessment) return "Проверка не выполнена";
  if (assessment.classification === "possible_change") return "Возможно, новый объём";
  if (assessment.classification === "likely_in_scope") return "Есть похожий пункт";
  return "Нужно уточнить";
}

export default function Home() {
  const [project, setProject] = useState<DemoProject>(() => createSeedProject());
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [analysis, setAnalysis] = useState<ScopeAssessment | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [incomingText, setIncomingText] = useState(project.incomingMessage.text);
  const [showDraft, setShowDraft] = useState(false);
  const [draftDescription, setDraftDescription] = useState("Добавить отдельную страницу с тарифами и сравнением планов.");
  const [toast, setToast] = useState("");
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const saveRevision = useRef(0);
  const { authenticatedAddress, isAuthenticated } = useWalletSession();
  const canEdit = isPublicPreview || isAuthenticated;
  const doneCount = project.criteria.filter((criterion) => criterion.checked).length;

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/project", { cache: "no-store" });
        if (!response.ok) throw new Error("Не удалось загрузить проект.");
        const savedProject = await response.json() as DemoProject;
        if (!active) return;
        setProject(savedProject);
        setIncomingText(savedProject.incomingMessage.text);
        setSaveState("saved");
        await requestScopeAssessment(savedProject.incomingMessage.text, savedProject);
      } catch {
        if (!active) return;
        setSaveState("error");
        setAnalysisError(isPublicPreview ? "Не удалось загрузить демо-проект. Обновите страницу и попробуйте снова." : "Локальный API недоступен. Запустите проект командой pnpm dev.");
      }
    }

    void load();
    return () => { active = false; };
    // The first request hydrates the local demo once per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }

  function persist(nextProject: DemoProject) {
    if (isPublicPreview) {
      setProject(nextProject);
      setSaveState("saved");
      return;
    }
    if (!isAuthenticated) {
      notify("Подключите кошелёк и подтвердите вход подписью, чтобы сохранить изменение.");
      return;
    }
    const revision = ++saveRevision.current;
    setProject(nextProject);
    setSaveState("saving");
    writeQueue.current = writeQueue.current
      .catch(() => undefined)
      .then(async () => {
        const response = await fetch("/api/project", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextProject),
        });
        if (!response.ok) throw new Error("Could not save project");
        const savedProject = await response.json() as DemoProject;
        if (saveRevision.current === revision) {
          setProject(savedProject);
          setSaveState("saved");
        }
      })
      .catch(() => {
        if (saveRevision.current === revision) {
          setSaveState("error");
          notify("Не удалось сохранить. Проверьте, что локальный сервер запущен.");
        }
      });
  }

  async function requestScopeAssessment(message: string, targetProject = project) {
    setAnalyzing(true);
    setAnalysisError("");
    try {
      const response = await fetch("/api/scope-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, scopeItems: targetProject.scopeItems }),
      });
      if (!response.ok) throw new Error("Проверка не выполнена.");
      setAnalysis(await response.json() as ScopeAssessment);
      return true;
    } catch {
      setAnalysisError("Не удалось сравнить сообщение с объёмом. Попробуйте ещё раз.");
      return false;
    } finally {
      setAnalyzing(false);
    }
  }

  async function runScopeCheck() {
    if (!canEdit) {
      notify("Чтобы сохранить результат сравнения, войдите подписью подключённого кошелька.");
      return;
    }
    const trimmed = incomingText.trim();
    if (!trimmed || trimmed.length > 1_000) {
      setAnalysisError("Сообщение должно содержать от 1 до 1 000 символов.");
      return;
    }

    const checked = await requestScopeAssessment(trimmed);
    if (!checked) return;
    const nextProject: DemoProject = {
      ...project,
      incomingMessage: { ...project.incomingMessage, text: trimmed, dateLabel: "сегодня" },
      suggestionDismissed: false,
      activity: addActivity(project, "Система", "сравнил новое сообщение с согласованным объёмом"),
      updatedAt: new Date().toISOString(),
    };
    persist(nextProject);
    notify("Сравнение готово. Это правило-подсказка, решение остаётся за участниками.");
  }

  function toggleCriterion(id: string) {
    const criteria = project.criteria.map((criterion) => criterion.id === id ? { ...criterion, checked: !criterion.checked } : criterion);
    persist({ ...project, criteria, milestone: { ...project.milestone, accepted: false }, updatedAt: new Date().toISOString() });
  }

  function acceptMilestone() {
    const nextProject: DemoProject = {
      ...project,
      milestone: { ...project.milestone, accepted: true },
      activity: addActivity(project, "Алия", `отметила этап «${project.milestone.title}» принятым в локальном демо`),
      updatedAt: new Date().toISOString(),
    };
    persist(nextProject);
    notify(isPublicPreview ? "Изменение видно только в этом предпросмотре; транзакция не отправлялась." : "Этап отмечен принятым в локальном демо. Транзакция в Solana не отправлялась.");
  }

  function saveChangeDraft() {
    const description = draftDescription.trim();
    if (!description) return;
    const nextProject: DemoProject = {
      ...project,
      changeRequest: {
        id: `change-${crypto.randomUUID()}`,
        title: analysis?.requestExcerpt.slice(0, 100) || "Запрос на изменение объёма",
        description,
        status: "draft",
        createdAt: new Date().toISOString(),
      },
      suggestionDismissed: false,
      activity: addActivity(project, "Алия", "создала черновик запроса на изменение"),
      updatedAt: new Date().toISOString(),
    };
    persist(nextProject);
    setShowDraft(false);
    notify(isPublicPreview ? "Черновик доступен только в этом предпросмотре и не сохраняется после обновления." : "Черновик сохранён локально. Для изменения объёма нужны подтверждения обеих сторон.");
  }

  function cancelChangeDraft() {
    if (!project.changeRequest || !window.confirm(isPublicPreview ? "Удалить черновик из этого предпросмотра?" : "Удалить этот локальный черновик запроса?")) return;
    const nextProject: DemoProject = {
      ...project,
      changeRequest: null,
      suggestionDismissed: false,
      activity: addActivity(project, "Алия", "удалила черновик запроса на изменение"),
      updatedAt: new Date().toISOString(),
    };
    persist(nextProject);
    notify("Черновик удалён. Подсказку можно пересмотреть или изменить сообщение.");
  }

  function dismissSuggestion() {
    const nextProject: DemoProject = {
      ...project,
      suggestionDismissed: true,
      activity: addActivity(project, "Алия", "закрыла подсказку, оставив решение участникам"),
      updatedAt: new Date().toISOString(),
    };
    persist(nextProject);
    notify("Подсказка закрыта. Согласованный объём не изменён.");
  }

  const saveLabel = saveState === "loading" ? "Загружаю…" : saveState === "saving" ? "Сохраняю…" : saveState === "error" ? "Нет соединения" : isPublicPreview ? "Демо · не сохраняется" : "Сохранено локально";
  const hasDraft = project.changeRequest !== null;
  const isSuggestionVisible = !hasDraft && !project.suggestionDismissed;

  if (saveState === "loading") {
    return <div className="loading-screen" role="status"><span className="brand-mark">S</span><span>{isPublicPreview ? "Загружаю демо-проект…" : "Загружаю проект и локальную историю…"}</span></div>;
  }

  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="brand-lockup"><div className="brand-mark" aria-hidden="true">S</div><div><div className="brand-name">SenimScope</div><div className="brand-caption">ясные договорённости</div></div></div>
        <div className="side-label">Рабочее пространство</div>
        <nav className="side-nav" aria-label="Главная навигация">
          <button className="side-link active"><span className="side-glyph" aria-hidden="true">◫</span>Обзор проекта</button>
          <button className="side-link" onClick={() => notify("В демо доступен один проект")}><span className="side-glyph" aria-hidden="true">▤</span>Договорённости</button>
          <button className="side-link" onClick={() => notify(isPublicPreview ? "Это пример истории; новые события не сохраняются." : "История событий хранится локально в этом проекте")}><span className="side-glyph" aria-hidden="true">◷</span>История изменений</button>
        </nav>
        <div className="side-project"><div className="side-label">Текущий проект</div><div className="project-switcher"><span className="project-dot"/><span><strong>{project.title}</strong><small>2 участника · 3 этапа</small></span></div></div>
        <div className="sidebar-spacer"/><div className="help-card"><strong>Один источник правды</strong><p>Объём, запросы и приёмка собраны рядом — чтобы договорённости не терялись в переписке.</p></div>
        <div className="profile"><div className="avatar">А</div><div><strong>Алия Сейтова</strong><small>Исполнитель · демо</small></div></div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="crumbs">Мои проекты <span aria-hidden="true"> / </span> <strong>{project.title}</strong></div>
          <div className="top-actions"><span className="save-state" role="status" data-state={saveState}>{saveLabel}</span><span className="demo-badge">{isPublicPreview ? "ПУБЛИЧНЫЙ ПРЕДПРОСМОТР" : "ЛОКАЛЬНЫЙ ДЕМО-ПРОЕКТ"}</span>{!isPublicPreview && <><ClusterSelect/><WalletAuthControl/><WalletButton/></>}</div>
        </header>

        <main className="workspace-content">
          <div className="page-heading">
            <div><div className="eyebrow">ПРОЕКТ · ВЕБ-ДИЗАЙН</div><h1>{project.title}</h1><p>Согласованный объём, прогресс и запросы на изменения в одном месте.</p></div>
            <div className="heading-meta"><span className={`status-pill${project.milestone.accepted ? " accepted" : ""}`}><span className="status-dot"/>{project.milestone.accepted ? "Этап принят в демо" : "В работе"}</span><span>Обновлено {new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(project.updatedAt))}</span></div>
          </div>

          <section className="summary-grid" aria-label="Сводка проекта">
            <article className="panel milestone-panel">
              <div className="panel-top"><div><div className="panel-label">Текущий этап · до {project.milestone.dueLabel}</div><h2 className="milestone-title">{project.milestone.title}</h2><div className="muted-copy">Макет desktop + mobile · два круга правок</div></div><span className="milestone-number">02 / 03</span></div>
              <div className="progress-line" aria-label="Этап 2 из 3"><span className="progress-segment done"/><span className="progress-segment done"/><span className="progress-segment"/></div>
              <div className="milestone-foot"><span><strong>{doneCount} из {project.criteria.length}</strong> пунктов готовы</span><span>Предыдущий этап принят 4 окт</span></div>
            </article>
            <article className="panel people-panel"><div className="panel-label">Участники</div>
              <div className="people-row"><div className="avatar">А</div><div><strong>Алия Сейтова</strong><small>Дизайн и разработка</small></div><span className="role-tag">Исполнитель</span></div>
              <div className="people-row"><div className="avatar" style={{ background: "#dce4e7", color: "#465f68" }}>М</div><div><strong>Марат Нурланов</strong><small>Заказчик · на связи</small></div><span className="role-tag">Клиент</span></div>
            </article>
          </section>

          <section className="content-grid" aria-label="Работа над этапом">
            <article className="panel section-panel">
              <div className="section-title-row"><div><h2>Критерии приёмки</h2><div className="section-subtitle">Список зафиксирован в согласованном объёме</div></div><span className="count-badge">{doneCount}/{project.criteria.length}</span></div>
              <div className="checklist">{project.criteria.map((criterion) => <div className={`check-row${criterion.checked ? " is-checked" : ""}`} key={criterion.id}>
                <button className={`check-box${criterion.checked ? " checked" : ""}`} onClick={() => toggleCriterion(criterion.id)} disabled={!canEdit} aria-label={`${criterion.checked ? "Отметить невыполненным" : "Отметить выполненным"}: ${criterion.title}`} aria-pressed={criterion.checked}>{criterion.checked ? "✓" : ""}</button>
                <div className="check-copy"><strong>{criterion.title}</strong><small>{criterion.detail}</small></div><span className="check-owner">{criterion.owner}</span>
              </div>)}</div>
              <div className="acceptance-footer"><p>{isPublicPreview ? "Изменения доступны только в этой вкладке и сбросятся после обновления." : isAuthenticated ? "Демо-приёмка сохраняется после подписи кошелька." : "Подключите кошелёк и войдите подписью, чтобы менять чек-лист и сохранять приёмку."}</p><button className="primary-button" onClick={acceptMilestone} disabled={!canEdit || doneCount !== project.criteria.length || project.milestone.accepted}>{project.milestone.accepted ? "Этап принят ✓" : "Принять этап"}</button></div>
            </article>

            <article className="panel change-card">
              <div className="change-head"><div className="ai-mark" aria-hidden="true">S</div><div className="change-head-copy"><strong>{hasDraft ? "Черновик запроса сохранён" : project.suggestionDismissed ? "Подсказка рассмотрена" : classificationLabel(analysis)}</strong><small>{hasDraft ? "Ожидает решения сторон" : "Сравнение с согласованным объёмом"}</small></div><span className="ai-badge">ПРАВИЛА · ДЕМО</span></div>
              <div className="change-body">
                <label className="panel-label" htmlFor="incoming-message" style={{ display: "block", marginBottom: 8 }}>СООБЩЕНИЕ КЛИЕНТА</label>
                <textarea id="incoming-message" className="message-input" value={incomingText} maxLength={1_000} onChange={(event) => setIncomingText(event.target.value)} aria-describedby="message-help" disabled={!canEdit || hasDraft} />
                <div className="message-tools"><span id="message-help">{!canEdit ? "Войдите подписью кошелька, чтобы запускать сравнение" : hasDraft ? "Сначала удалите черновик, чтобы заменить сообщение" : `${incomingText.length}/1 000 символов · ${isPublicPreview ? "анализ без сохранения" : "локальный анализ"}`}</span><button className="text-button" onClick={runScopeCheck} disabled={!canEdit || analyzing || hasDraft}>{analyzing ? "Сравниваю…" : "Сравнить с объёмом"}</button></div>
                {analysisError && <p className="inline-error" role="alert">{analysisError}</p>}
                {analysis && <div className="assessment" data-classification={analysis.classification} aria-live="polite">
                  <div className="assessment-title"><span className="assessment-dot"/><strong>{classificationLabel(analysis)}</strong><span>{analysis.confidence === "medium" ? "средняя уверенность" : "низкая уверенность"}</span></div>
                  <p>{analysis.summary}</p>
                  <div className="evidence-block"><span className="evidence-label">ФРАГМЕНТ ЗАПРОСА</span><q>{analysis.requestExcerpt}</q></div>
                  {analysis.matchedScopeItems.length > 0 && <div className="scope-evidence"><span className="evidence-label">ПОХОЖИЕ ПУНКТЫ</span>{analysis.matchedScopeItems.map((item) => <div key={item.id}><strong>{item.title}</strong><small>{item.excerpt}</small></div>)}</div>}
                  {analysis.classification === "possible_change" && <div className="scope-diff"><div><b>ЕСТЬ</b><span>{analysis.relatedScopeItems.length ? analysis.relatedScopeItems.map((item) => item.title).join(" · ") : "Согласованный список критериев этапа"}</span></div><div><b>НЕ НАЙДЕНО</b><span>{analysis.requestExcerpt}</span></div></div>}
                </div>}
                {hasDraft ? <>
                  <div className="accepted-state"><span>◷</span><span><strong>{project.changeRequest?.title}</strong><br/>{project.changeRequest?.description}<br/>Черновик не меняет объём, цену или срок до подтверждения обеих сторон.</span></div>
                  <p className="advisory-note">Текущий демо-аккаунт не подтверждает личность участников; реальные взаимные approvals добавим вместе с авторизацией.</p>
                  <button className="text-button draft-cancel" onClick={cancelChangeDraft} disabled={!canEdit}>Удалить черновик</button>
                </> : project.suggestionDismissed ? <div className="accepted-state"><span>✓</span><span>Вы закрыли подсказку. Согласованный объём не изменён.</span></div> : analysis && <>
                  <div className="change-actions"><button className="primary-button" onClick={() => { setDraftDescription(analysis.requestExcerpt); setShowDraft(true); }} disabled={!canEdit}>Создать запрос</button><button className="secondary-button" onClick={dismissSuggestion} disabled={!canEdit}>Закрыть подсказку</button></div>
                  <p className="advisory-note">Это упрощённые правила, не подключённая языковая модель. Подсказка не решает, входит ли работа в объём.</p>
                </>}
              </div>
            </article>
          </section>

          <section className="panel section-panel history-panel">
            <div className="section-title-row"><div><h2>Недавняя активность</h2><div className="section-subtitle">{isPublicPreview ? "Пример истории; новые события видны только до обновления" : "События сохраняются в локальной истории"}</div></div><span className="panel-label">LOCAL DEMO</span></div>
            <div className="activity-list">{project.activity.slice(0, 5).map((item) => <div className="activity-item" key={item.id}><span className="activity-marker">•</span><p><strong>{item.actor}</strong> {item.action}</p><time>{item.dateLabel}</time></div>)}</div>
          </section>
          <p className="advisory-note" style={{ marginTop: 16 }}>{isPublicPreview ? "Публичный preview: изменения видны только в текущей вкладке и сбросятся после обновления. Текст сообщения отправляется в API приложения для rule-based сравнения, но не сохраняется в базе. Не вводите приватные переписки." : `Локальный прототип: состояние сохраняется в JSON-файл на этой машине. ${authenticatedAddress ? `Текущая демо-сессия: ${authenticatedAddress.slice(0, 4)}…${authenticatedAddress.slice(-4)}.` : "Вход подтверждается подписью кошелька без транзакции."} Общая база и транзакции Solana пока не подключены.`}</p>
        </main>
      </div>

      {showDraft && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowDraft(false); }} className="modal-backdrop">
        <section role="dialog" aria-modal="true" aria-labelledby="draft-title" className="panel draft-dialog">
          <div className="eyebrow">НОВЫЙ ЗАПРОС · ЧЕРНОВИК</div><h2 id="draft-title">Предложить изменение</h2><p className="muted-copy">Запрос фиксирует предложение, но не меняет объём и цену автоматически.</p>
          <label htmlFor="change-description" className="panel-label">ОПИСАНИЕ ИЗМЕНЕНИЯ</label><textarea id="change-description" value={draftDescription} maxLength={1_000} onChange={(event) => setDraftDescription(event.target.value)} />
          <div className="dialog-actions"><button className="secondary-button" onClick={() => setShowDraft(false)}>Отмена</button><button className="primary-button" onClick={saveChangeDraft} disabled={!canEdit || !draftDescription.trim()}>Сохранить черновик</button></div>
        </section>
      </div>}
      {toast && <div className="toast-message" role="status">{toast}</div>}
    </div>
  );
}
