import { useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import {
  ProfileModal,
  ProfileModalSection,
} from "../../workspace/components/ProfileModal";

export function ProfileSection() {
  const { session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <section className="crm-panel">
        <div className="crm-panel-head">
          <div className="crm-panel-title-group">
            <h2>Meu perfil</h2>
            <span className="pill">Conta</span>
          </div>
          <div className="crm-panel-head-actions">
            <button
              type="button"
              className="btn solid"
              onClick={() => setIsOpen(true)}
            >
              Ver perfil
            </button>
          </div>
        </div>

        <div className="profile-grid">
          <article className="profile-card">
            <span>Email</span>
            <strong>{session?.email || "-"}</strong>
          </article>

          <article className="profile-card">
            <span>Role</span>
            <strong>{session?.role || "-"}</strong>
          </article>

          <article className="profile-card">
            <span>User ID</span>
            <strong>{session?.userId || "-"}</strong>
          </article>

          <article className="profile-card">
            <span>Company ID</span>
            <strong>{session?.companyId || "-"}</strong>
          </article>
        </div>
      </section>

      {isOpen && (
        <ProfileModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          icon={<></>}
          title="Meu perfil"
          subtitle={session?.email}
          mode="view"
        >
          <ProfileModalSection label="Dados da conta">
            <div className="profile-form-fields-grid profile-form-personal-grid">
              <div className="field field-span-6">
                <label>Role</label>
                <input
                  value={session?.role || "-"}
                  disabled
                  className="field-readonly"
                />
              </div>

              <div className="field field-span-6">
                <label>User ID</label>
                <input
                  value={session?.userId || "-"}
                  disabled
                  className="field-readonly"
                />
              </div>

              <div className="field field-span-12">
                <label>Company ID</label>
                <input
                  value={session?.companyId || "-"}
                  disabled
                  className="field-readonly"
                />
              </div>
            </div>
          </ProfileModalSection>
        </ProfileModal>
      )}
    </>
  );
}
