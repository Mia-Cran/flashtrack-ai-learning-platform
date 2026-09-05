import mariaPhoto from "../../assets/maria-photo.png";
import "./AboutPage.css";

function AboutPage() {
  return (
    <section className="about">
      <div className="about__image-circle">
        <img className="about__image"
         src={mariaPhoto}
         alt="Maria smiling" />
      </div>

      <h1 className="about__title">
        About <span className="about__brand">FlashTrack</span>
      </h1>

      <div className="about__content">
        <p>
          Most learning tools are built the same way for everyone — same
          pace, same amount of information, same presentation, regardless of
          how your brain actually works.
        </p>

        <p>
          FlashTrack, powered by Adapt AI, exists because learning
          isn&rsquo;t one-size-fits-all. I built it around a simple belief:
          the learner should come first, not the content.
        </p>

        <p>
          Search any topic, and AI generates a full study card — a simple
          definition, a beginner-friendly explanation, a technical
          definition, a real-world analogy, code examples where relevant, and
          common mistakes to avoid. Sections stay collapsed until you&rsquo;re
          ready for them, so you&rsquo;re never hit with a wall of
          information all at once. I designed it this way based on my own
          experience with ADHD — what helps me focus tends to help other
          people too.
        </p>

        <p>
          This is <strong>version 2.0</strong> of an ongoing project.{" "}
          <strong>Version 3.0</strong> will bring adaptive learning,
          personalized quizzes, and support for learners across different
          subjects and needs — building toward a platform that actually
          adapts to you, not the other way around.
        </p>
      </div>
    </section>
  );
}

export default AboutPage;