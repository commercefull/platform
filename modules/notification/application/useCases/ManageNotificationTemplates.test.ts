import { createNotificationTemplate, createNotificationTemplateRepository } from '../../tests/testUtils';
import { ManageNotificationTemplatesUseCase } from './ManageNotificationTemplates';

describe('ManageNotificationTemplatesUseCase', () => {
  let useCase: ManageNotificationTemplatesUseCase;
  let templateRepo: ReturnType<typeof createNotificationTemplateRepository>;

  beforeEach(() => {
    templateRepo = createNotificationTemplateRepository();
    useCase = new ManageNotificationTemplatesUseCase(templateRepo);
  });

  it('should delegate each read to the repository', async () => {
    const templates = [createNotificationTemplate()];
    templateRepo.findAll.mockResolvedValue(templates);
    templateRepo.findByCategory.mockResolvedValue(templates);
    templateRepo.findById.mockResolvedValue(templates[0]);
    templateRepo.count.mockResolvedValue(3);

    expect(await useCase.findAll(true)).toEqual(templates);
    expect(await useCase.findByCategory('orders', false)).toEqual(templates);
    expect(await useCase.findById('tpl-1')).toEqual(templates[0]);
    expect(await useCase.count(true)).toBe(3);

    expect(templateRepo.findAll).toHaveBeenCalledWith(true);
    expect(templateRepo.findByCategory).toHaveBeenCalledWith('orders', false);
    expect(templateRepo.findById).toHaveBeenCalledWith('tpl-1');
    expect(templateRepo.count).toHaveBeenCalledWith(true);
  });

  it('should delegate each write to the repository', async () => {
    const template = createNotificationTemplate();
    templateRepo.create.mockResolvedValue(template);
    templateRepo.update.mockResolvedValue(template);
    templateRepo.activate.mockResolvedValue(template);
    templateRepo.deactivate.mockResolvedValue(template);
    templateRepo.delete.mockResolvedValue(true);
    templateRepo.clone.mockResolvedValue(template);
    templateRepo.getPreview.mockResolvedValue({ template });

    await useCase.create({ code: 'x', name: 'X', type: 'order', supportedChannels: ['email'], defaultChannel: 'email', isActive: true });
    await useCase.update('tpl-1', { name: 'Renamed' });
    await useCase.activate('tpl-1');
    await useCase.deactivate('tpl-1');
    await useCase.delete('tpl-1');
    await useCase.clone('tpl-1', 'new_code', 'New Name');
    await useCase.getPreview('tpl-1', { name: 'Jane' });

    expect(templateRepo.create).toHaveBeenCalledWith(expect.objectContaining({ code: 'x' }));
    expect(templateRepo.update).toHaveBeenCalledWith('tpl-1', { name: 'Renamed' });
    expect(templateRepo.activate).toHaveBeenCalledWith('tpl-1');
    expect(templateRepo.deactivate).toHaveBeenCalledWith('tpl-1');
    expect(templateRepo.delete).toHaveBeenCalledWith('tpl-1');
    expect(templateRepo.clone).toHaveBeenCalledWith('tpl-1', 'new_code', 'New Name');
    expect(templateRepo.getPreview).toHaveBeenCalledWith('tpl-1', { name: 'Jane' });
  });
});
