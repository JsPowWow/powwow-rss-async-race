import { RaceSceneController } from '@/views/race-scene';

export const debug = {
  initialize: (options?: { sceneController?: boolean }): void => {
    const { sceneController = false } = options ?? {};
    RaceSceneController.logger.setEnabled(sceneController);
  },
};
