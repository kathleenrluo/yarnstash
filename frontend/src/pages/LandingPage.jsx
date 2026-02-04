/**
 * Landing Page
 * 
 * Introduction page for the Yarn Stash Tracker application.
 * This will be fleshed out later with personal introduction.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../styles/theme';

const LandingPage = () => {
  const navigate = useNavigate();
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
    },
    content: {
      maxWidth: '1000px',
      textAlign: 'center',
    },
    title: {
      fontSize: '2.5rem',
      marginBottom: theme.spacing.md,
      color: theme.colors.textPrimary,
    },
    description: {
      fontSize: theme.typography.fontSize.xl,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xxl,
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
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Welcome to Yarn Stash Tracker</h1>
        <p style={styles.description}>
          Track your yarn collection, manage your projects, and calculate yarn usage
          all in one place.
        </p>
        <div style={styles.features}>
          <div 
            style={styles.feature}
            onClick={() => handleFeatureClick('/stash')}
            onMouseEnter={handleFeatureMouseEnter}
            onMouseLeave={handleFeatureMouseLeave}
          >
            <h3 style={styles.featureHeader}>Stash Management</h3>
            <p style={styles.featureParagraph}>Track your yarn collection with smart autocomplete, auto-fill for duplicate yarns, and photo uploads. Filter by favorite, weight, color, brand, or material, and search across all properties. Stash quantities automatically update as you use yarn in projects.</p>
          </div>
          <div 
            style={styles.feature}
            onClick={() => handleFeatureClick('/projects')}
            onMouseEnter={handleFeatureMouseEnter}
            onMouseLeave={handleFeatureMouseLeave}
          >
            <h3 style={styles.featureHeader}>Project Tracking</h3>
            <p style={styles.featureParagraph}>Record your crochet and knitting projects with yarn usage tracking that automatically deducts from stash. Care instructions are calculated based on project materials, and you can organize with tags and favorites. Cross-navigate between projects and their yarns.</p>
          </div>
          <div 
            style={styles.feature}
            onClick={() => handleFeatureClick('/calculator')}
            onMouseEnter={handleFeatureMouseEnter}
            onMouseLeave={handleFeatureMouseLeave}
          >
            <h3 style={styles.featureHeader}>Calculator</h3>
            <p style={styles.featureParagraph}>Estimate yarn needs for your projects based on stitch counts and pattern dimensions. Check if you have enough yarn in your stash before starting, and get accurate estimates to avoid running out mid-project.</p>
          </div>
        </div>
        
        <div style={styles.aboutSection}>
          <h2 style={styles.aboutTitle}>About Me</h2>
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
        
        <div style={styles.interestsSection}>
          <h2 style={styles.interestsTitle}>Other Interests</h2>
          <p style={styles.interestsText}>
            Outside of crocheting and coding, I love board games AND video games, with longtime favorites including Super Mario Galaxy, Smash, and LittleBigPlanet 2. I recently finished Silksong and am always looking for new game recs! I'm a dancer with a love for fashion (especially accessories and metal hardware) and I'm gradually learning knitting, sewing, and embroidery to build a more sustainable and unique wardrobe. I love spending time baking and making drinks with my friends, and when I'm not indoors, I'm usually hiking, skiing, or snowboarding B)
          </p>
        </div>

        {carouselImages.length > 0 && (
          <div style={styles.carouselSection}>
            <h2 style={styles.carouselTitle}>Gallery</h2>
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
