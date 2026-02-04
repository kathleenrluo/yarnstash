/**
 * Calculator Page
 * 
 * Yarn usage calculator for estimating yarn needs based on stitch counts.
 * This will be implemented in Phase 5 of the project.
 */

const CalculatorPage = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1>Yarn Calculator</h1>
        <p style={styles.placeholder}>
          The yarn calculator will be available soon. This feature will allow you to:
        </p>
        <ul style={styles.features}>
          <li>Enter stitch counts for your project</li>
          <li>Select yarn and hook size</li>
          <li>Calculate estimated meters and grams needed</li>
          <li>Check if you have enough yarn in your stash</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: 'calc(100vh - 200px)',
    padding: '2rem',
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto',
    textAlign: 'center',
  },
  placeholder: {
    fontSize: '1.1rem',
    color: '#666',
    marginBottom: '2rem',
  },
  features: {
    textAlign: 'left',
    display: 'inline-block',
    color: '#666',
    lineHeight: '2',
  },
};

export default CalculatorPage;
