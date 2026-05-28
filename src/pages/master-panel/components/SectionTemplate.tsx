import type { MasterSectionItem } from "../types";

type SectionTemplateProps = {
  item: MasterSectionItem;
};

export function SectionTemplate({ item }: SectionTemplateProps) {
  return (
    <section className="crm-panel">
      <div className="crm-panel-head">
        <div>
          <p className="auth-kicker">Template inicial</p>
          <h2>{item.title}</h2>
          <p>{item.description}</p>
        </div>

        {item.badge ? <span className="crm-chip">{item.badge}</span> : null}
      </div>

      <article className="auth-card">
        <h3>Próximo passo</h3>
        <p>
          Esta tela é um template inicial do novo painel master. A próxima etapa será conectar os dados do endpoint correspondente.
        </p>
      </article>

      <article className="auth-card">
        <h3>Escopo da seção</h3>
        <p>
          O layout já separa a navegação por domínio. Aqui entra apenas a
          implementação específica de {item.label.toLowerCase()}.
        </p>
      </article>
    </section>
  );
}