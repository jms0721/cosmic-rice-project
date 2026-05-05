import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the main cosmic rice layout', () => {
  render(<App />);

  expect(screen.getByText('식당 목록')).toBeInTheDocument();
  expect(screen.getByText('커뮤니티')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
});
