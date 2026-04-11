import { Link } from "react-router-dom";
import kidsSpaceIcon from "../assets/kids_space_icon.png";

const works = [
  {
    title: "Pulseira inteligente",
    detail: "Identificacao rapida e historico de entradas por crianca.",
  },
  {
    title: "Triagem expressa",
    detail: "Fluxo de check-in em menos de 40 segundos no pico do evento.",
  },
  {
    title: "Checkout seguro",
    detail: "Validacao por CPF para garantir retirada por responsavel correto.",
  },
];

const services = [
  "Cadastro de responsaveis e criancas",
  "Controle de colaboradores por role",
  "Painel de check-ins ativos em tempo real",
  "Historico de atendimentos por empresa",
];

const posts = [
  {
    title: "Como reduzir fila no check-in de eventos infantis",
    tag: "Operacao",
  },
  {
    title: "Checklist de seguranca para espacos kids temporarios",
    tag: "Seguranca",
  },
  {
    title: "Indicadores que mostram a saude da sua operacao",
    tag: "Gestao",
  },
];

export function HomePage() {
  return (
    <div className="page-wrap">
      <header className="topbar">
        <a href="#home" className="brand">
          <img src={kidsSpaceIcon} alt="KidsSpace" className="brand-icon" />
          KidsSpace
        </a>
        <nav className="menu" aria-label="Primary">
          <a href="#about">About</a>
          <a href="#works">Works</a>
          <a href="#services">Services</a>
          <a href="#testimonial">Testimonial</a>
          <a href="#blog">Blog</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="topbar-actions">
          <Link className="btn ghost" to="/login">
            Login
          </Link>
          <Link className="btn solid" to="/signup/company">
            Cadastrar company
          </Link>
        </div>
      </header>

      <main>
        <section id="home" className="hero-section">
          <p className="kicker">
            Sistema de check-in e checkout para espaco kids
          </p>
          <h1>Operacao segura, rapida e preparada para evento lotado.</h1>
          <p className="lead">
            Uma plataforma criada para equipes que precisam controlar entrada e
            saida de criancas com confianca, rastreabilidade e fluxo leve no
            atendimento.
          </p>
          <div className="hero-actions">
            <Link to="/signup/company" className="btn solid">
              Quero cadastrar minha company
            </Link>
            <Link to="/login" className="btn outline">
              Acessar login
            </Link>
          </div>
          <div className="hero-metrics">
            <article>
              <strong>99.9%</strong>
              <span>confianca no fluxo de checkout</span>
            </article>
            <article>
              <strong>3 roles</strong>
              <span>master/admin, company e collaborator</span>
            </article>
            <article>
              <strong>Tempo real</strong>
              <span>visao de check-ins ativos por empresa</span>
            </article>
          </div>
        </section>

        <section id="about" className="panel">
          <h2>About</h2>
          <p>
            O KidsSpace nasceu para padronizar operacoes de espaco kids em
            eventos, com foco em cadastro rapido, autorizacao por role e
            retirada segura baseada em documento.
          </p>
        </section>

        <section id="works" className="panel">
          <div className="section-head">
            <h2>Works</h2>
            <p>Como o sistema funciona no dia a dia da operacao.</p>
          </div>
          <div className="grid three">
            {works.map((item) => (
              <article key={item.title} className="card">
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="services" className="panel">
          <div className="section-head">
            <h2>Services</h2>
            <p>Modulos essenciais para cada empresa parceira.</p>
          </div>
          <ul className="service-list">
            {services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </section>

        <section id="testimonial" className="panel split">
          <div>
            <h2>Testimonial</h2>
            <p>
              "No ultimo fim de semana, fizemos mais de 600 movimentacoes entre
              check-in e check-out sem fila critica. A equipe ficou mais segura
              e os pais perceberam a organizacao."
            </p>
            <span className="caption">
              Coordenacao de operacao, evento infantil em shopping
            </span>
          </div>
          <div className="quote-box" aria-hidden="true">
            <span>01</span>
            <p>Fluxo limpo + seguranca por CPF + visao em tempo real.</p>
          </div>
        </section>

        <section id="blog" className="panel">
          <div className="section-head">
            <h2>Blog</h2>
            <p>Conteudos para escalar sua operacao com qualidade.</p>
          </div>
          <div className="grid three">
            {posts.map((post) => (
              <article key={post.title} className="card blog-card">
                <span className="pill">{post.tag}</span>
                <h3>{post.title}</h3>
                <a href="#contact">Ler em breve</a>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="panel contact-panel">
          <h2>Contact</h2>
          <p>
            Quer levar o KidsSpace para sua operacao? Deixe seu e-mail e nossa
            equipe retorna.
          </p>
          <form
            className="contact-form"
            onSubmit={(event) => event.preventDefault()}
          >
            <label htmlFor="email">Email profissional</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="operacao@empresa.com"
            />
            <button type="submit" className="btn solid">
              Entrar na lista de lancamento
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
