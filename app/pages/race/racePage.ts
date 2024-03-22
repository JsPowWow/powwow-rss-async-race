import { assertIsNonNullable } from '@/utils';

const apiGarageBtn = document.getElementById('api-garage-btn');
const apiStartSecondBtn = document.getElementById('api-start-engine-btn');

const app = document.getElementById('app');

assertIsNonNullable(apiGarageBtn);
assertIsNonNullable(apiStartSecondBtn);
assertIsNonNullable(app);
apiGarageBtn.addEventListener('click', () => {
  fetch('http://localhost:3000/garage', { method: 'GET' })
    .then((res) => res.json())
    .then((res) => {
      console.log(res);
      if (Array.isArray(res)) {
        res.forEach((c: { name: string; color: string }) => {
          const car = document.createElement('div');
          car.innerHTML = `${c.name}`;
          car.style.color = c.color;
          app.append(car);
        });
      }
    });
});

apiStartSecondBtn.addEventListener('click', () => {
  console.log('Check start 2nd Engine Api...');
  assertIsNonNullable(app);

  fetch('http://localhost:3000/engine?id=2&status=started', { method: 'PATCH' })
    .then((res) => res.json())
    .then((res) => {
      console.log(res);
    });
});
