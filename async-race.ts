import { assertIsNonNullable } from '@/utils';
import { RacePageStandalone } from '@/view/race';

const app = document.getElementById('app');
assertIsNonNullable(app);
app.append(new RacePageStandalone().element);
