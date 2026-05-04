import { useProfile } from "../hooks/useProfile";

export function ProfileSection() {
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

  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <h2>Meu perfil</h2>
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
        </div>

        {isLoading ? (
          <p>Carregando dados do perfil...</p>
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
            className="crm-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Editar perfil"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Alterar dados</h2>
            <form className="crm-form-grid" onSubmit={onSaveProfileModal}>
              {personalProfileFields.length > 0 && (
                <div className="profile-section">
                  <h3>Dados pessoais</h3>
                  <div className="crm-form-grid">
                    {personalProfileFields.map((field) => {
                      const readOnly = !field.editable;

                      return (
                        <div key={field.key} className="field">
                          <label htmlFor={`profile-${field.key}`}>
                            {field.label}
                          </label>
                          <input
                            id={`profile-${field.key}`}
                            value={profileDraft[field.key] || ""}
                            onChange={(event) =>
                              setProfileDraft((current) => ({
                                ...current,
                                [field.key]: event.target.value,
                              }))
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
              )}

              {addressProfileFields.length > 0 && (
                <div className="profile-section">
                  <h3>Endereco</h3>
                  <div className="crm-form-grid">
                    {addressProfileFields.map((field) => {
                      const readOnly = !field.editable;

                      return (
                        <div key={field.key} className="field">
                          <label htmlFor={`profile-${field.key}`}>
                            {field.label}
                          </label>
                          <input
                            id={`profile-${field.key}`}
                            value={profileDraft[field.key] || ""}
                            onChange={(event) =>
                              setProfileDraft((current) => ({
                                ...current,
                                [field.key]: event.target.value,
                              }))
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
              )}

              <div className="crm-modal-actions">
                <button
                  type="button"
                  className="btn outline"
                  onClick={() => setIsProfileModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn solid">
                  Salvar alteracoes
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
