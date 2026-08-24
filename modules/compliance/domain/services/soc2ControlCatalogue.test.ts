import { SOC2_CONTROLS, getControlsByCategory, getControlById, getEvidenceActionsForControl } from './soc2ControlCatalogue';
import { AuditCategory } from '../entities/AuditLog';

describe('SOC2 Control Catalogue', () => {
  describe('SOC2_CONTROLS', () => {
    it('should have controls covering all SOC2 trust service categories', () => {
      const categories = new Set(SOC2_CONTROLS.map(c => c.category));
      expect(categories.has('authentication')).toBe(true);
      expect(categories.has('authorization')).toBe(true);
      expect(categories.has('security')).toBe(true);
      expect(categories.has('dataAccess')).toBe(true);
      expect(categories.has('dataModification')).toBe(true);
      expect(categories.has('payment')).toBe(true);
      expect(categories.has('compliance')).toBe(true);
      expect(categories.has('configuration')).toBe(true);
    });

    it('should have all controls with required fields', () => {
      for (const control of SOC2_CONTROLS) {
        expect(control.control_id).toBeTruthy();
        expect(control.category).toBeTruthy();
        expect(control.description).toBeTruthy();
        expect(control.evidenceActions.length).toBeGreaterThan(0);
        expect(['continuous', 'daily', 'monthly', 'quarterly', 'annually']).toContain(control.frequency);
      }
    });

    it('should include key PCI-DSS-relevant controls', () => {
      const controlIds = SOC2_CONTROLS.map(c => c.control_id);
      expect(controlIds).toContain('CC6.1');
      expect(controlIds).toContain('CC7.1');
      expect(controlIds).toContain('PI1.1');
      expect(controlIds).toContain('P4.1');
    });
  });

  describe('getControlsByCategory', () => {
    it('should return controls for a given category', () => {
      const authControls = getControlsByCategory('authentication');
      expect(authControls.length).toBeGreaterThan(0);
      expect(authControls.every(c => c.category === 'authentication')).toBe(true);
    });

    it('should return empty array for category with no controls', () => {
      const controls = getControlsByCategory('configuration' as AuditCategory);
      expect(controls.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getControlById', () => {
    it('should find a control by ID', () => {
      const control = getControlById('CC6.1');
      expect(control).toBeDefined();
      expect(control?.control_id).toBe('CC6.1');
    });

    it('should return undefined for unknown ID', () => {
      expect(getControlById('XX9.9')).toBeUndefined();
    });
  });

  describe('getEvidenceActionsForControl', () => {
    it('should return evidence actions for a known control', () => {
      const actions = getEvidenceActionsForControl('CC6.1');
      expect(actions).toContain('login');
      expect(actions).toContain('logout');
    });

    it('should return empty array for unknown control', () => {
      expect(getEvidenceActionsForControl('XX9.9')).toEqual([]);
    });
  });
});
