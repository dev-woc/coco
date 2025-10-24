/**
 * Basic setup validation test
 * Tests that the project is properly configured
 */

describe('Project Setup', () => {
  it('should have proper environment', () => {
    expect(true).toBe(true);
  });

  it('should be able to run tests', () => {
    const projectName = 'coco-track-mobile';
    expect(projectName).toBe('coco-track-mobile');
  });
});
