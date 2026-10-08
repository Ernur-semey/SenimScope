export type AcceptanceCriterion = {
  id: string;
  title: string;
  detail: string;
  owner: string;
  checked: boolean;
};

export type ScopeItem = {
  id: string;
  title: string;
  description: string;
};

export type ProjectActivity = {
  id: string;
  actor: string;
  action: string;
  dateLabel: string;
};

export type ChangeRequestDraft = {
  id: string;
  title: string;
  description: string;
  status: "draft";
  createdAt: string;
};

export type DemoProject = {
  id: string;
  title: string;
  milestone: {
    id: string;
    title: string;
    dueLabel: string;
    accepted: boolean;
  };
  scopeItems: ScopeItem[];
  criteria: AcceptanceCriterion[];
  incomingMessage: {
    id: string;
    author: string;
    text: string;
    dateLabel: string;
  };
  changeRequest: ChangeRequestDraft | null;
  suggestionDismissed: boolean;
  activity: ProjectActivity[];
  updatedAt: string;
};

export function createSeedProject(): DemoProject {
  return {
    id: "senim-studio-landing",
    title: "Лендинг Senim Studio",
    milestone: {
      id: "milestone-02",
      title: "Визуальная система и первый экран",
      dueLabel: "18 октября",
      accepted: false,
    },
    scopeItems: [
      { id: "scope-home", title: "Главная страница", description: "Первый экран, преимущества и призыв к действию" },
      { id: "scope-visual", title: "Визуальное направление", description: "Цвета, типографика и два варианта обложки" },
      { id: "scope-responsive", title: "Адаптивная версия", description: "Макет desktop и mobile до ширины 390 px" },
      { id: "scope-revisions", title: "Два круга правок", description: "Две сводные итерации корректировок по этапу" },
    ],
    criteria: [
      { id: "criterion-structure", title: "Собрать структуру главной страницы", detail: "Первый экран, преимущества и призыв к действию", owner: "Исполнитель", checked: true },
      { id: "criterion-visual", title: "Подготовить визуальное направление", detail: "Цвета, типографика и два варианта обложки", owner: "Исполнитель", checked: true },
      { id: "criterion-desktop", title: "Сверстать desktop-версию", detail: "Адаптивная сетка до 1440 px", owner: "Исполнитель", checked: false },
      { id: "criterion-mobile", title: "Проверить мобильную версию", detail: "Ширины 390 px и 768 px", owner: "Исполнитель", checked: false },
    ],
    incomingMessage: {
      id: "message-pricing-page",
      author: "Марат",
      text: "Можем ещё добавить отдельную страницу с тарифами и сравнением планов?",
      dateLabel: "сегодня",
    },
    changeRequest: null,
    suggestionDismissed: false,
    activity: [
      { id: "activity-first-stage", actor: "Марат", action: "принял этап «Структура и контент»", dateLabel: "4 окт" },
      { id: "activity-client-message", actor: "Марат", action: "предложил добавить страницу с тарифами", dateLabel: "сегодня" },
    ],
    updatedAt: new Date().toISOString(),
  };
}

export function isDemoProject(value: unknown): value is DemoProject {
  if (!value || typeof value !== "object") return false;
  const project = value as Partial<DemoProject>;
  return project.id === "senim-studio-landing"
    && typeof project.title === "string" && project.title.length <= 200
    && typeof project.updatedAt === "string" && Number.isFinite(Date.parse(project.updatedAt))
    && !!project.milestone
    && typeof project.milestone.id === "string"
    && typeof project.milestone.title === "string"
    && typeof project.milestone.dueLabel === "string"
    && typeof project.milestone.accepted === "boolean"
    && Array.isArray(project.scopeItems) && project.scopeItems.length <= 40
    && project.scopeItems.every((item) => !!item && typeof item.id === "string" && item.id.length <= 100 && typeof item.title === "string" && item.title.length <= 200 && typeof item.description === "string" && item.description.length <= 500)
    && Array.isArray(project.criteria) && project.criteria.length <= 40
    && project.criteria.every((item) => !!item && typeof item.id === "string" && item.id.length <= 100 && typeof item.title === "string" && item.title.length <= 200 && typeof item.detail === "string" && item.detail.length <= 500 && typeof item.owner === "string" && item.owner.length <= 100 && typeof item.checked === "boolean")
    && !!project.incomingMessage
    && typeof project.incomingMessage.id === "string"
    && typeof project.incomingMessage.author === "string"
    && typeof project.incomingMessage.text === "string" && project.incomingMessage.text.length <= 1_000
    && typeof project.incomingMessage.dateLabel === "string"
    && (project.changeRequest === null || (!!project.changeRequest && typeof project.changeRequest.id === "string" && project.changeRequest.id.length <= 100 && typeof project.changeRequest.title === "string" && project.changeRequest.title.length <= 200 && typeof project.changeRequest.description === "string" && project.changeRequest.description.length <= 1_000 && project.changeRequest.status === "draft" && typeof project.changeRequest.createdAt === "string" && Number.isFinite(Date.parse(project.changeRequest.createdAt))))
    && typeof project.suggestionDismissed === "boolean"
    && Array.isArray(project.activity) && project.activity.length <= 12
    && project.activity.every((item) => !!item && typeof item.id === "string" && item.id.length <= 100 && typeof item.actor === "string" && item.actor.length <= 100 && typeof item.action === "string" && item.action.length <= 500 && typeof item.dateLabel === "string" && item.dateLabel.length <= 100);
}
