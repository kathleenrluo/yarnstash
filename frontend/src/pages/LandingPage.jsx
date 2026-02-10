/**
 * Landing Page
 * 
 * Introduction page for the Yarn Stash Tracker application.
 * This will be fleshed out later with personal introduction.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const carouselImages = [
    '/carousel-1.JPG',
    '/carousel-2.JPG',
    '/carousel-3.JPG',
    '/carousel-4.JPG',
    '/carousel-5.JPG',
    '/carousel-6.JPG',
    '/carousel-7.JPG',
    '/carousel-8.JPG',
    '/carousel-9.JPG',
  ];

  const handleFeatureClick = (path) => {
    navigate(path);
  };

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? carouselImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => 
      prev === carouselImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleDotClick = (index) => {
    setCurrentImageIndex(index);
  };

  const getStyles = () => ({
    container: {
      minHeight: 'calc(100vh - 200px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
      width: '100%',
      boxSizing: 'border-box',
    },
    content: {
      maxWidth: '1000px',
      textAlign: 'center',
      width: '100%',
    },
    title: {
      fontSize: '2.5rem',
      marginBottom: theme.spacing.md,
      color: theme.colors.textPrimary,
    },
    description: {
      fontSize: theme.typography.fontSize.xl,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    signInPrompt: {
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xxl,
    },
    signInButton: {
      padding: `${theme.spacing['2xs']} ${theme.spacing['2md']}`,
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${theme.colors.primary}`,
      backgroundColor: theme.colors.background,
      color: theme.colors.primary,
      fontWeight: theme.typography.fontWeight.semibold,
      cursor: 'pointer',
      fontSize: theme.typography.fontSize.base,
      transition: theme.transitions.normal,
    },
    features: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: theme.spacing.xl,
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.xxl,
    },
    feature: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      border: `1px solid ${theme.colors.borderNeutral}`,
      cursor: 'pointer',
      transition: theme.transitions.normal,
      textAlign: 'left',
    },
    featureHeader: {
      textAlign: 'center',
      margin: 0,
      marginBottom: theme.spacing.sm,
    },
    featureParagraph: {
      textAlign: 'left',
      margin: 0,
      marginTop: theme.spacing.sm,
    },
    featureHover: {
      backgroundColor: theme.colors.surfaceHover,
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows.lg,
    },
    aboutSection: {
      marginTop: theme.spacing.xxl,
      padding: theme.spacing.xxl,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${theme.colors.border}`,
      boxShadow: theme.shadows.md,
    },
    aboutTitle: {
      fontSize: theme.typography.fontSize['3xl'],
      marginBottom: theme.spacing.xl,
      color: theme.colors.primary,
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.md,
      flexWrap: 'wrap',
    },
    socialLinks: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginLeft: 'auto',
    },
    socialLink: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      color: theme.colors.textPrimary,
      textDecoration: 'none',
      transition: theme.transitions.normal,
      cursor: 'pointer',
    },
    socialLinkHover: {
      backgroundColor: theme.colors.surfaceHover,
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows.md,
    },
    aboutContent: {
      display: 'flex',
      flexDirection: 'row',
      gap: theme.spacing.xxl,
      alignItems: 'flex-start',
      textAlign: 'left',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
    },
    aboutImageContainer: {
      flexShrink: 0,
    },
    aboutImage: {
      width: '300px',
      height: '300px',
      borderRadius: theme.borderRadius.lg,
      objectFit: 'cover',
      border: `1px solid ${theme.colors.border}`,
    },
    aboutText: {
      flex: 1,
    },
    aboutBlurb: {
      fontSize: theme.typography.fontSize.lg,
      lineHeight: theme.typography.lineHeight.relaxed,
      color: theme.colors.textPrimary,
      margin: 0,
    },
    interestsSection: {
      marginTop: theme.spacing.xxl,
      padding: theme.spacing.xxl,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${theme.colors.border}`,
      boxShadow: theme.shadows.md,
      width: '100%',
      boxSizing: 'border-box',
    },
    interestsTitle: {
      fontSize: theme.typography.fontSize['3xl'],
      marginBottom: theme.spacing.xl,
      color: theme.colors.primary,
      textAlign: 'left',
    },
    interestsText: {
      fontSize: theme.typography.fontSize.lg,
      lineHeight: theme.typography.lineHeight.relaxed,
      color: theme.colors.textPrimary,
      margin: 0,
      textAlign: 'left',
    },
    carouselSection: {
      marginTop: theme.spacing.xxl,
      padding: theme.spacing.xxl,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${theme.colors.border}`,
      boxShadow: theme.shadows.md,
      width: '100%',
      boxSizing: 'border-box',
    },
    carouselTitle: {
      fontSize: theme.typography.fontSize['3xl'],
      marginBottom: theme.spacing.xl,
      color: theme.colors.primary,
      textAlign: 'left',
    },
    carouselContainer: {
      position: 'relative',
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
    },
    carouselImageWrapper: {
      position: 'relative',
      width: '100%',
      maxHeight: '600px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.background,
    },
    carouselImage: {
      maxWidth: '100%',
      maxHeight: '600px',
      width: 'auto',
      height: 'auto',
      objectFit: 'contain',
      display: 'block',
    },
    carouselPlaceholder: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: theme.colors.textLight,
      fontSize: theme.typography.fontSize.lg,
      fontStyle: 'italic',
      border: `2px dashed ${theme.colors.border}`,
      borderRadius: theme.borderRadius.lg,
    },
    carouselButton: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.borderRadius.full,
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: theme.transitions.normal,
      color: theme.colors.textPrimary,
      fontSize: theme.typography.fontSize.xl,
      zIndex: 2,
    },
    carouselButtonPrev: {
      left: theme.spacing.md,
    },
    carouselButtonNext: {
      right: theme.spacing.md,
    },
    carouselButtonHover: {
      backgroundColor: theme.colors.surfaceHover,
      boxShadow: theme.shadows.md,
    },
    carouselDots: {
      display: 'flex',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.lg,
    },
    carouselDot: {
      width: '12px',
      height: '12px',
      borderRadius: theme.borderRadius.full,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surface,
      cursor: 'pointer',
      transition: theme.transitions.normal,
    },
    carouselDotActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
  });

  const styles = getStyles();

  const handleFeatureMouseEnter = (e) => {
    Object.assign(e.currentTarget.style, {
      backgroundColor: theme.colors.surfaceHover,
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows.lg,
    });
  };

  const handleFeatureMouseLeave = (e) => {
    Object.assign(e.currentTarget.style, {
      backgroundColor: theme.colors.surface,
      transform: 'translateY(0)',
      boxShadow: 'none',
    });
  };

  return (
    <div style={styles.container} className="landing-container">
      <div style={styles.content} className="landing-content">
        <h1 style={styles.title} className="landing-title">Welcome to Yarn Stash Tracker</h1>
        <p style={styles.description} className="landing-description">
          Track your yarn collection, manage your projects, and calculate yarn usage
          all in one place.
        </p>
        {!isAuthenticated && (
          <p style={styles.signInPrompt}>
            <button type="button" onClick={login} style={styles.signInButton}>
              Sign in with Google
            </button>
            {' '}to get started.
          </p>
        )}
        <div style={styles.features} className="landing-features">
          <div 
            style={styles.feature}
            className="landing-feature"
            onClick={() => handleFeatureClick('/stash')}
            onMouseEnter={handleFeatureMouseEnter}
            onMouseLeave={handleFeatureMouseLeave}
          >
            <h3 style={styles.featureHeader}>Stash Management</h3>
            <p style={styles.featureParagraph}>Track your yarn collection with smart autocomplete, auto-fill for duplicate yarns, and photo uploads. Filter by favorite, weight, color, brand, or material, and search across all properties. Stash quantities automatically update as you use yarn in projects.</p>
          </div>
          <div 
            style={styles.feature}
            className="landing-feature"
            onClick={() => handleFeatureClick('/projects')}
            onMouseEnter={handleFeatureMouseEnter}
            onMouseLeave={handleFeatureMouseLeave}
          >
            <h3 style={styles.featureHeader}>Project Tracking</h3>
            <p style={styles.featureParagraph}>Record your crochet and knitting projects with yarn usage tracking that automatically deducts from stash. Care instructions are calculated based on project materials, and you can organize with tags and favorites. Cross-navigate between projects and their yarns.</p>
          </div>
          <div 
            style={styles.feature}
            className="landing-feature"
            onClick={() => handleFeatureClick('/calculator')}
            onMouseEnter={handleFeatureMouseEnter}
            onMouseLeave={handleFeatureMouseLeave}
          >
            <h3 style={styles.featureHeader}>Calculator</h3>
            <p style={styles.featureParagraph}>Estimate yarn needs for your projects based on stitch counts and pattern dimensions. Check if you have enough yarn in your stash before starting, and get accurate estimates to avoid running out mid-project.</p>
          </div>
        </div>
        
        <div style={styles.aboutSection} className="landing-section">
          <h2 style={styles.aboutTitle} className="landing-section-title">
            About Me
            <div style={styles.socialLinks} className="social-links-mobile">
              <a
                href="https://www.instagram.com/b.lakout"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.socialLink}
                className="social-link-mobile"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = theme.shadows.md;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surface;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                aria-label="Instagram"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="currentColor"/>
                </svg>
              </a>
              <a
                href="mailto:kathyjiang8@gmail.com"
                style={styles.socialLink}
                className="social-link-mobile"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = theme.shadows.md;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surface;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                aria-label="Email"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
                </svg>
              </a>
              <a
                href="https://github.com/kathleenrluo/yarnstash"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.socialLink}
                className="social-link-mobile"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = theme.shadows.md;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.surface;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                aria-label="GitHub"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="currentColor"/>
                </svg>
              </a>
            </div>
          </h2>
          <div style={styles.aboutContent} className="about-content-responsive">
            <div style={styles.aboutImageContainer}>
              <img 
                src="/about-me.JPG" 
                alt="About me" 
                style={styles.aboutImage}
                className="about-image-responsive"
              />
            </div>
            <div style={styles.aboutText}>
              <p style={styles.aboutBlurb}>
                Hi! I'm Kat, a serial hobbyist. When something catches my interest, I think about how to push the medium, combine it with skills I already have, and reduce friction in my workflow.
              </p>
              <p style={styles.aboutBlurb}>
                I care about details, efficiency, and repeatability, and I enjoy refining processes until they feel clean, intuitive, and reliable. That mindset shows up in everything I build, including this tracker. It's designed around features I've always wanted but couldn't quite find elsewhere: useful sorting, smart autofill, automatic care-instruction calculation, and stash quantities that update themselves as projects progress.
              </p>
              <p style={styles.aboutBlurb}>
                This site is both a personal tool and a reflection of how I like to think—optimistic about systems and focused on making them work better. I hope you enjoy :)
              </p>
            </div>
          </div>
        </div>
        
        <div style={styles.interestsSection} className="landing-section">
          <h2 style={styles.interestsTitle} className="landing-section-title">Other Interests</h2>
          <p style={styles.interestsText} className="interests-text-responsive">
            Outside of crocheting and coding, I love board games AND video games, with longtime favorites including Super Mario Galaxy, Smash, and LittleBigPlanet 2. I recently finished Silksong and am always looking for new game recs! I'm a dancer with a love for fashion (especially accessories and metal hardware) and I'm gradually learning knitting, sewing, and embroidery to build a more sustainable and unique wardrobe. I love spending time baking and making drinks with my friends, and when I'm not indoors, I'm usually hiking, skiing, or snowboarding B)
          </p>
        </div>

        {carouselImages.length > 0 && (
          <div style={styles.carouselSection} className="landing-section carousel-section-responsive">
            <h2 style={styles.carouselTitle} className="landing-section-title">Gallery</h2>
            <div style={styles.carouselContainer}>
              <div style={styles.carouselImageWrapper} className="carousel-image-wrapper">
                <img
                  src={carouselImages[currentImageIndex]}
                  alt={`Gallery image ${currentImageIndex + 1}`}
                  style={styles.carouselImage}
                />
                {carouselImages.length > 1 && (
                  <>
                    <button
                      style={{...styles.carouselButton, ...styles.carouselButtonPrev}}
                      className="carousel-button"
                      onClick={handlePrevious}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                        e.currentTarget.style.boxShadow = theme.shadows.md;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.surface;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button
                      style={{...styles.carouselButton, ...styles.carouselButtonNext}}
                      className="carousel-button"
                      onClick={handleNext}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                        e.currentTarget.style.boxShadow = theme.shadows.md;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.surface;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      aria-label="Next image"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              {carouselImages.length > 1 && (
                <div style={styles.carouselDots}>
                  {carouselImages.map((_, index) => (
                    <button
                      key={index}
                      style={{
                        ...styles.carouselDot,
                        ...(index === currentImageIndex ? styles.carouselDotActive : {}),
                      }}
                      onClick={() => handleDotClick(index)}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {carouselImages.length === 0 && (
          <div style={styles.carouselSection}>
            <h2 style={styles.carouselTitle}>Gallery</h2>
            <div style={styles.carouselContainer}>
              <div style={styles.carouselImageWrapper} className="carousel-image-wrapper">
                <div style={styles.carouselPlaceholder}>
                  Add your photos to the carouselImages array in LandingPage.jsx
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default LandingPage;
