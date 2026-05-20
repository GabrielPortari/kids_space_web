import { useProfile } from "../hooks/useProfile";
import { SkeletonBlock } from "../components/WorkspaceSkeleton";
import { useQueryClient } from "@tanstack/react-query";
import { maskPhone } from "../formatter";

export function ProfileSection() {
  const queryClient = useQueryClient();
  const {
    personalProfileFields,
    addressProfileFields,
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileDraft,
    setProfileDraft,
    openProfileEditModal,
    onSaveProfileModal,
    myCompanyQuery,
    myCollaboratorQuery,
  } = useProfile();

  const isLoading = myCompanyQuery.isLoading || myCollaboratorQuery.isLoading;
  const handleRefresh = () => {
    void queryClient.resetQueries({ queryKey: ["my-company"] });
    void queryClient.resetQueries({ queryKey: ["my-collaborator"] });
  };

  const personalFieldSpanClasses: Record<string, string> = {
    name: "field-span-12",
    legalName: "field-span-12",
    email: "field-span-6",
    contact: "field-span-6",
    logoUrl: "field-span-6",
    website: "field-span-6",
    document: "field-span-4",
    cnpj: "field-span-4",
    birthDate: "field-span-4",
  };

  const addressFieldSpanClasses: Record<string, string> = {
    "address.street": "field-span-4",
    "address.number": "field-span-2",
    "address.complement": "field-span-3",
    "address.neighborhood": "field-span-3",
    "address.city": "field-span-4",
    "address.state": "field-span-2",
    "address.country": "field-span-3",
    "address.zipCode": "field-span-3",
  };

  const addressFieldsByKey = Object.fromEntries(
    addressProfileFields.map((field) => [field.key, field]),
  );

  const addressTopRowKeys = [
    "address.street",
    "address.number",
    "address.complement",
    "address.neighborhood",
  ];

  const addressBottomRowKeys = [
    "address.city",
    "address.state",
    "address.country",
    "address.zipCode",
  ];

  const isCompanyProfile = personalProfileFields.some(
    (field) => field.key === "legalName" || field.key === "logoUrl",
  );

  const personalFieldsByKey = Object.fromEntries(
    personalProfileFields.map((field) => [field.key, field]),
  );

  const companyPersonalRowOne = ["name", "legalName"];
  const companyPersonalRowTwo = ["email", "contact", "website"];
  const companyPersonalRowThree = ["logoUrl", "cnpj"];

  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Meu perfil</h2>
          <div className="crm-panel-head-actions">
            {(personalProfileFields.length > 0 ||
              addressProfileFields.length > 0) && (
              <button
                type="button"
                className="btn solid"
                onClick={openProfileEditModal}
              >
                Alterar dados
              </button>
            )}
            <button
              type="button"
              className="btn outline crm-icon-btn"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Atualizar perfil"
              title="Atualizar perfil"
            >
              ↻
            </button>
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="profile-section">
              <h3>Dados pessoais</h3>
              <div className="profile-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <article
                    key={`personal-skeleton-${index}`}
                    className="profile-card profile-card-skeleton"
                  >
                    <SkeletonBlock
                      className="workspace-skeleton-line"
                      width="40%"
                      height="0.7rem"
                    />
                    <SkeletonBlock
                      className="workspace-skeleton-line"
                      width="85%"
                      height="1.1rem"
                    />
                  </article>
                ))}
              </div>
            </div>

            <div className="profile-section">
              <h3>Endereco</h3>
              <div className="profile-grid">
                {Array.from({ length: 8 }).map((_, index) => (
                  <article
                    key={`address-skeleton-${index}`}
                    className="profile-card profile-card-skeleton"
                  >
                    <SkeletonBlock
                      className="workspace-skeleton-line"
                      width="35%"
                      height="0.7rem"
                    />
                    <SkeletonBlock
                      className="workspace-skeleton-line"
                      width="78%"
                      height="1.1rem"
                    />
                  </article>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {personalProfileFields.length > 0 && (
              <div className="profile-section">
                <h3>Dados pessoais</h3>
                <div className="profile-grid">
                  {personalProfileFields.map((field) => (
                    <article key={field.key} className="profile-card">
                      <span>{field.label}</span>
                      <strong>{field.value || "-"}</strong>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {addressProfileFields.length > 0 && (
              <div className="profile-section">
                <h3>Endereco</h3>
                <div className="profile-grid">
                  {addressProfileFields.map((field) => (
                    <article key={field.key} className="profile-card">
                      <span>{field.label}</span>
                      <strong>{field.value || "-"}</strong>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {isProfileModalOpen && (
        <div
          className="crm-modal-backdrop"
          role="presentation"
          onClick={() => setIsProfileModalOpen(false)}
        >
          <section
            className="crm-modal crm-modal-wide profile-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Editar perfil"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-modal-header">
              <div className="profile-modal-header-left">
                <div className="profile-modal-avatar">
                  <span>👤</span>
                </div>
                <div>
                  <p className="profile-modal-title">Alterar dados</p>
                  <p className="profile-modal-subtitle">
                    Atualize suas informações de perfil
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="profile-modal-close"
                aria-label="Fechar"
                onClick={() => setIsProfileModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form className="profile-form" onSubmit={onSaveProfileModal}>
              <div className="profile-form-body">
                {personalProfileFields.length > 0 && (
                  <div className="profile-form-section">
                    <div className="profile-form-section-header">
                      <span className="profile-form-section-label">
                        Dados pessoais
                      </span>
                      <div className="profile-form-section-line" />
                    </div>
                    {isCompanyProfile ? (
                      <div className="profile-form-personal-stack">
                        <div className="profile-form-fields-grid profile-form-company-grid">
                          {companyPersonalRowOne.map((key) => {
                            const field = personalFieldsByKey[key];
                            if (!field) return null;

                            const readOnly = !field.editable;

                            return (
                              <div
                                key={field.key}
                                className={`field ${
                                  field.key === "name"
                                    ? "field-span-6"
                                    : "field-span-6"
                                }`}
                              >
                                <label htmlFor={`profile-${field.key}`}>
                                  {field.label}
                                </label>
                                <input
                                  id={`profile-${field.key}`}
                                  type={field.key === "email" ? "email" : "text"}
                                  value={profileDraft[field.key] || ""}
                                  onChange={(event) =>
                                    setProfileDraft((current) => ({
                                      ...current,
                                      [field.key]:
                                        field.key === "contact"
                                          ? maskPhone(event.target.value)
                                          : event.target.value,
                                    }))
                                  }
                                  inputMode={
                                    field.key === "contact" ? "tel" : undefined
                                  }
                                  readOnly={readOnly}
                                  disabled={readOnly}
                                  className={readOnly ? "field-readonly" : ""}
                                />
                              </div>
                            );
                          })}
                        </div>

                        <div className="profile-form-fields-grid profile-form-company-grid">
                          {companyPersonalRowTwo.map((key) => {
                            const field = personalFieldsByKey[key];
                            if (!field) return null;

                            const readOnly = !field.editable;

                            return (
                              <div key={field.key} className="field field-span-4">
                                <label htmlFor={`profile-${field.key}`}>
                                  {field.label}
                                </label>
                                <input
                                  id={`profile-${field.key}`}
                                  type={field.key === "email" ? "email" : "text"}
                                  value={profileDraft[field.key] || ""}
                                  onChange={(event) =>
                                    setProfileDraft((current) => ({
                                      ...current,
                                      [field.key]:
                                        field.key === "contact"
                                          ? maskPhone(event.target.value)
                                          : event.target.value,
                                    }))
                                  }
                                  inputMode={
                                    field.key === "contact" ? "tel" : undefined
                                  }
                                  readOnly={readOnly}
                                  disabled={readOnly}
                                  className={readOnly ? "field-readonly" : ""}
                                />
                              </div>
                            );
                          })}
                        </div>

                        <div className="profile-form-fields-grid profile-form-company-grid">
                          {companyPersonalRowThree.map((key) => {
                            const field = personalFieldsByKey[key];
                            if (!field) return null;

                            const readOnly = !field.editable;
                            const spanClass = field.key === "logoUrl" ? "field-span-8" : "field-span-4";

                            return (
                              <div key={field.key} className={`field ${spanClass}`}>
                                <label htmlFor={`profile-${field.key}`}>
                                  {field.label}
                                </label>
                                <input
                                  id={`profile-${field.key}`}
                                  type={field.key === "email" ? "email" : "text"}
                                  value={profileDraft[field.key] || ""}
                                  onChange={(event) =>
                                    setProfileDraft((current) => ({
                                      ...current,
                                      [field.key]:
                                        field.key === "contact"
                                          ? maskPhone(event.target.value)
                                          : event.target.value,
                                    }))
                                  }
                                  inputMode={
                                    field.key === "contact" ? "tel" : undefined
                                  }
                                  readOnly={readOnly}
                                  disabled={readOnly}
                                  className={readOnly ? "field-readonly" : ""}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="profile-form-fields-grid profile-form-personal-grid">
                        {personalProfileFields.map((field) => {
                          const readOnly = !field.editable;
                          return (
                            <div
                              key={field.key}
                              className={`field ${personalFieldSpanClasses[field.key] || "field-span-6"}`}
                            >
                              <label htmlFor={`profile-${field.key}`}>
                                {field.label}
                              </label>
                              <input
                                id={`profile-${field.key}`}
                                type={field.key === "email" ? "email" : "text"}
                                value={profileDraft[field.key] || ""}
                                onChange={(event) =>
                                  setProfileDraft((current) => ({
                                    ...current,
                                    [field.key]:
                                      field.key === "contact"
                                        ? maskPhone(event.target.value)
                                        : event.target.value,
                                  }))
                                }
                                inputMode={
                                  field.key === "contact" ? "tel" : undefined
                                }
                                readOnly={readOnly}
                                disabled={readOnly}
                                className={readOnly ? "field-readonly" : ""}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {addressProfileFields.length > 0 && (
                  <div className="profile-form-section">
                    <div className="profile-form-section-header">
                      <span className="profile-form-section-label">
                        Endereço
                      </span>
                      <div className="profile-form-section-line" />
                    </div>
                    <div className="profile-form-address-stack">
                      <div className="profile-form-fields-grid profile-form-address-grid">
                        {addressTopRowKeys.map((key) => {
                          const field = addressFieldsByKey[key];
                          if (!field) {
                            return null;
                          }

                          const readOnly = !field.editable;

                          return (
                            <div
                              key={field.key}
                              className={`field ${addressFieldSpanClasses[field.key] || "field-span-3"}`}
                            >
                              <label htmlFor={`profile-${field.key}`}>
                                {field.label}
                              </label>
                              <input
                                id={`profile-${field.key}`}
                                type={field.key === "email" ? "email" : "text"}
                                value={profileDraft[field.key] || ""}
                                onChange={(event) =>
                                  setProfileDraft((current) => ({
                                    ...current,
                                    [field.key]:
                                      field.key === "contact"
                                        ? maskPhone(event.target.value)
                                        : event.target.value,
                                  }))
                                }
                                inputMode={
                                  field.key === "contact" ? "tel" : undefined
                                }
                                readOnly={readOnly}
                                disabled={readOnly}
                                className={readOnly ? "field-readonly" : ""}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="profile-form-fields-grid profile-form-address-grid">
                        {addressBottomRowKeys.map((key) => {
                          const field = addressFieldsByKey[key];
                          if (!field) {
                            return null;
                          }

                          const readOnly = !field.editable;

                          return (
                            <div
                              key={field.key}
                              className={`field ${addressFieldSpanClasses[field.key] || "field-span-3"}`}
                            >
                              <label htmlFor={`profile-${field.key}`}>
                                {field.label}
                              </label>
                              <input
                                id={`profile-${field.key}`}
                                type={field.key === "email" ? "email" : "text"}
                                value={profileDraft[field.key] || ""}
                                onChange={(event) =>
                                  setProfileDraft((current) => ({
                                    ...current,
                                    [field.key]:
                                      field.key === "contact"
                                        ? maskPhone(event.target.value)
                                        : event.target.value,
                                  }))
                                }
                                inputMode={
                                  field.key === "contact" ? "tel" : undefined
                                }
                                readOnly={readOnly}
                                disabled={readOnly}
                                className={readOnly ? "field-readonly" : ""}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-modal-footer">
                <p className="profile-modal-hint">
                  🔒 Campos acinzentados são somente leitura
                </p>
                <div className="profile-modal-footer-actions">
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => setIsProfileModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn solid">
                    Salvar alterações
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
