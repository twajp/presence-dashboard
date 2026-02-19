import { useRef, useState, useEffect, useCallback } from 'react';
import Draggable from 'react-draggable';
import { PRESENCE_STATUS_CONFIG } from '../config/presence';
import type { Seat, User } from '../types/dashboard.types';

type SeatItemProps = {
    seat: Seat;
    onUpdate: (id: number, data: Partial<User>) => void;
    users: User[];
    isSettingsMode: boolean;
    onStatusClick: (user: User) => void;
    prefersDarkMode: boolean;
};

export const SeatItem = ({
    seat,
    onUpdate,
    users,
    isSettingsMode,
    onStatusClick,
    prefersDarkMode
}: SeatItemProps) => {
    const draggedRef = useRef(false);
    const nodeRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        corner: '',
        startX: 0,
        startY: 0
    });
    const user = users.find((u) => u.id === seat.userId);

    const width = user?.width || 80;
    const height = user?.height || 40;
    const isVertical = height > width;

    const handleResizeStart = useCallback((e: React.MouseEvent, corner: string) => {
        if (!isSettingsMode) return;
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: width,
            height: height,
            corner: corner,
            startX: seat.x,
            startY: seat.y
        });
    }, [isSettingsMode, width, height, seat.x, seat.y]);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - resizeStart.x;
            const deltaY = e.clientY - resizeStart.y;

            let newWidth = resizeStart.width;
            let newHeight = resizeStart.height;
            let newX = resizeStart.startX;
            let newY = resizeStart.startY;

            if (resizeStart.corner.includes('e')) {
                newWidth = Math.max(40, Math.round((resizeStart.width + deltaX) / 8) * 8);
            } else if (resizeStart.corner.includes('w')) {
                newWidth = Math.max(40, Math.round((resizeStart.width - deltaX) / 8) * 8);
                newX = resizeStart.startX + (resizeStart.width - newWidth);
            }

            if (resizeStart.corner.includes('s')) {
                newHeight = Math.max(40, Math.round((resizeStart.height + deltaY) / 8) * 8);
            } else if (resizeStart.corner.includes('n')) {
                newHeight = Math.max(40, Math.round((resizeStart.height - deltaY) / 8) * 8);
                newY = resizeStart.startY + (resizeStart.height - newHeight);
            }

            if (nodeRef.current) {
                nodeRef.current.style.width = `${newWidth}px`;
                nodeRef.current.style.height = `${newHeight}px`;
                nodeRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            if (nodeRef.current && user) {
                const finalWidth = parseInt(nodeRef.current.style.width);
                const finalHeight = parseInt(nodeRef.current.style.height);
                const transform = nodeRef.current.style.transform;
                const match = transform.match(/translate\((-?\d+)px, (-?\d+)px\)/);
                const finalX = match ? parseInt(match[1]) : seat.x;
                const finalY = match ? parseInt(match[2]) : seat.y;
                onUpdate(seat.id, { width: finalWidth, height: finalHeight, x: finalX, y: finalY });
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, resizeStart, onUpdate, seat.id, seat.x, seat.y, user]);

    return (
        <Draggable
            nodeRef={nodeRef}
            position={{ x: seat.x, y: seat.y }}
            grid={[8, 8]}
            disabled={!isSettingsMode || isResizing}
            onStart={() => {
                draggedRef.current = false;
            }}
            onDrag={() => {
                draggedRef.current = true;
            }}
            onStop={(_e, data) => {
                onUpdate(seat.id, { x: data.x, y: data.y });
            }}
        >
            <div
                ref={nodeRef}
                onClick={() => {
                    if (draggedRef.current || isSettingsMode || !user) return;
                    onStatusClick(user);
                }}
                style={{
                    width: width,
                    height: height,
                    fontSize: '0.875rem',
                    display: 'flex',
                    flexDirection: isVertical ? 'column' : 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSettingsMode
                        ? (prefersDarkMode ? '#393939' : '#e0e0e0')
                        : PRESENCE_STATUS_CONFIG[seat.status].color,
                    color: isSettingsMode ? (prefersDarkMode ? '#fff' : '#000') : '#fff',
                    outline: isSettingsMode
                        ? (prefersDarkMode ? '2px solid #757575' : '2px solid #bdbdbd')
                        : 'none',
                    cursor: isSettingsMode ? 'move' : 'pointer',
                    userSelect: 'none',
                    position: 'absolute',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    borderRadius: '4px',
                    zIndex: isSettingsMode ? 100 : 1,
                    overflow: 'hidden',
                    textAlign: 'center',
                    wordBreak: 'keep-all',
                    overflowWrap: 'break-word',
                    lineHeight: 1.2
                }}
            >
                {user && (
                    <div style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: isVertical ? 3 : 2,
                        WebkitBoxOrient: 'vertical'
                    }}>
                        {user.name}
                    </div>
                )}

                {isSettingsMode && (
                    <>
                        {/* Top Left */}
                        <div
                            onMouseDown={(e) => handleResizeStart(e, 'nw')}
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: '8px',
                                height: '8px',
                                cursor: 'nwse-resize',
                                backgroundColor: prefersDarkMode ? '#757575' : '#bdbdbd',
                                borderRadius: '4px 0 0 0',
                                zIndex: 101
                            }}
                        />
                        {/* Top Right */}
                        <div
                            onMouseDown={(e) => handleResizeStart(e, 'ne')}
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                width: '8px',
                                height: '8px',
                                cursor: 'nesw-resize',
                                backgroundColor: prefersDarkMode ? '#757575' : '#bdbdbd',
                                borderRadius: '0 4px 0 0',
                                zIndex: 101
                            }}
                        />
                        {/* Bottom Left */}
                        <div
                            onMouseDown={(e) => handleResizeStart(e, 'sw')}
                            style={{
                                position: 'absolute',
                                left: 0,
                                bottom: 0,
                                width: '8px',
                                height: '8px',
                                cursor: 'nesw-resize',
                                backgroundColor: prefersDarkMode ? '#757575' : '#bdbdbd',
                                borderRadius: '0 0 0 4px',
                                zIndex: 101
                            }}
                        />
                        {/* Bottom Right */}
                        <div
                            onMouseDown={(e) => handleResizeStart(e, 'se')}
                            style={{
                                position: 'absolute',
                                right: 0,
                                bottom: 0,
                                width: '8px',
                                height: '8px',
                                cursor: 'nwse-resize',
                                backgroundColor: prefersDarkMode ? '#757575' : '#bdbdbd',
                                borderRadius: '0 0 4px 0',
                                zIndex: 101
                            }}
                        />
                    </>
                )}
            </div>
        </Draggable>
    );
};
