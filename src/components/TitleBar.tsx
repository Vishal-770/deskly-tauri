import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';

// Tauri v2 API for the current window
const appWindow = getCurrentWindow();

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    appWindow.isMaximized().then(setIsMaximized);
    const unlisten = appWindow.onResized(() => {
        appWindow.isMaximized().then(setIsMaximized);
    });
    return () => {
        unlisten.then(f => f());
    }
  }, []);

  return (
    <div
      data-tauri-drag-region
      onPointerDown={(e) => {
        // Enable manual drag if data-tauri-drag-region fails, while ignoring window control buttons
        if (e.buttons === 1 && !(e.target as HTMLElement).closest('button')) {
          appWindow.startDragging();
        }
      }}
      className="h-8 bg-background flex justify-between items-center select-none z-50 fixed top-0 left-0 right-0 w-full text-foreground border-b border-border shadow-sm"
    >
      {/* Title */}
      <div className="flex items-center pl-4 gap-2 pointer-events-none" data-tauri-drag-region>
         <span className="text-xs font-semibold text-muted-foreground tracking-wider">Deskly</span>
      </div>

      {/* Window Controls */}
      <div className="flex h-full">
        <button
          className="h-full px-4 hover:bg-muted flex items-center justify-center transition-colors"
          onClick={() => appWindow.minimize()}
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          className="h-full px-4 hover:bg-muted flex items-center justify-center transition-colors"
          onClick={() => appWindow.toggleMaximize()}
        >
          {isMaximized ? (
            <div className="relative w-3 h-3 mt-1">
                <div className="absolute top-0 right-0 w-2.5 h-2.5 border border-current rounded-sm"></div>
                <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border border-current rounded-sm bg-background"></div>
            </div>
          ) : (
            <Square className="w-3 h-3" />
          )}
        </button>
        <button
          className="h-full px-4 hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors"
          onClick={() => appWindow.close()}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
