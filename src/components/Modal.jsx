import { h, Fragment } from 'preact';
import { useEffect } from 'preact/hooks';
import Button from './Button';
import { Icon } from '../icons';

const SUCCESS_AUTO_CLOSE_MS = 2000;

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

const Backdrop = ({ onClose, children }) => (
  <div className="fixed inset-0 z-50 overflow-y-auto scrollbar-thin">
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
    {/* min-h-full, not min-h-screen: the scroller above is already the
        viewport, and a child a full screen tall plus this padding always
        overflowed it. */}
    <div className="flex min-h-full items-center justify-center p-2 sm:p-4 box-border">
      {children}
    </div>
  </div>
);

// A dialog over the page.
//
//   footer      what sits in the bottom bar: your own buttons, or false for
//               none. Left out, it is a Close button - or Cancel and a
//               confirm button when onConfirm is given.
//   type        "success" is a small self-closing confirmation instead.
//
// Escape and a click on the backdrop close it; the page behind stops
// scrolling while it is open.
const Modal = ({
  isOpen, onClose, title, children, message, size = 'md',
  footer, showFooter = true, onConfirm, confirmLabel = 'Confirm', confirmVariant = 'primary', type,
}) => {
  const isSuccess = type === 'success';

  useEffect(() => {
    if (!isOpen) return undefined;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  // A success dialog announces the result and closes itself.
  useEffect(() => {
    if (!isOpen || !isSuccess || !onClose) return undefined;
    const timer = setTimeout(onClose, SUCCESS_AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [isOpen, isSuccess, onClose]);

  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <Backdrop onClose={onClose}>
        <div
          role="dialog"
          aria-modal="true"
          className="relative panel rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 max-w-sm w-full p-5 text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
            <Icon icon="check" size={24} />
          </div>
          <h2 className="mt-3 text-base font-semibold text-gray-900 dark:text-white">{title || 'Success'}</h2>
          {(message || children) && (
            <div className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">{message || children}</div>
          )}
        </div>
      </Backdrop>
    );
  }

  const defaultFooter = onConfirm ? (
    <Fragment>
      <Button onClick={onClose} variant="secondary">Cancel</Button>
      <Button onClick={onConfirm} variant={confirmVariant}>{confirmLabel}</Button>
    </Fragment>
  ) : (
    <Button onClick={onClose} variant="secondary">Close</Button>
  );
  const footerContent = footer === false || !showFooter ? null : footer || defaultFooter;

  return (
    <Backdrop onClose={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={`relative panel rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 ${SIZES[size] || SIZES.md} w-full`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* The same scale as a Card header, so a dialog does not arrive
            noticeably larger than the page that opened it. */}
        <div className="flex items-center justify-between gap-4 px-5 py-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 -mr-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <Icon icon="close" size={20} />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[75vh] overflow-y-auto">
          {children || (message && <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>)}
        </div>

        {footerContent && (
          <div className="flex justify-end gap-2 px-5 py-3 rounded-b-2xl bg-gray-100/70 dark:bg-gray-900/30">
            {footerContent}
          </div>
        )}
      </div>
    </Backdrop>
  );
};

export default Modal;
