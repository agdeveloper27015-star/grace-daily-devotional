import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppView } from '../../types';
import PrimaryTopNav from '../../components/layout/PrimaryTopNav';

describe('PrimaryTopNav', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it('renderiza modo home com saudacao e ativa aba atual', async () => {
    const onNavigate = vi.fn<(view: AppView) => void>();

    await act(async () => {
      root.render(
        <PrimaryTopNav
          mode="home"
          currentView="ESTUDO"
          greeting="Bom dia"
          displayName="Grace User"
          onNavigate={onNavigate}
        />
      );
    });

    expect(container.textContent).toContain('Bom dia, Grace User');
    const active = container.querySelector('[aria-current="page"]');
    expect(active?.textContent).toContain('Inicio');
  });

  it('navega para perfil ao clicar no avatar', async () => {
    const onNavigate = vi.fn<(view: AppView) => void>();

    await act(async () => {
      root.render(
        <PrimaryTopNav
          mode="home"
          currentView="ESTUDO"
          greeting="Bom dia"
          displayName="Grace User"
          onNavigate={onNavigate}
        />
      );
    });

    const avatarButton = container.querySelector('button[aria-label="Abrir perfil"]');
    expect(avatarButton).not.toBeNull();

    await act(async () => {
      avatarButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onNavigate).toHaveBeenCalledWith('PERFIL');
  });
});
