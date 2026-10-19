import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, PanelLeftIcon, PanelRight, PenSquare, Plus, MessageSquare, User, LogOut, Coins, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { getConversations } from '../features/getConversations'
import { getLogOut } from '../features/logout'
import { updateConversation } from '../features/updateConversation'
import { deleteConversation } from '../features/deleteConversation'
import { useDispatch, useSelector } from 'react-redux'
import {
  setConversation,
  setselectedConversation
} from '../redux/conversationSlice'
import { clearInputText } from '../redux/chatSlice'

import { signOut } from 'firebase/auth'
import { auth } from '../../utils/firebase.js'
import { setUserData } from '../redux/userSlice'
import { setMessages, setInitializingConversation } from '../redux/messageSlice'
import { getCurrentUser } from '../features/getCurrentUser'
import Billing from './Billing'

export const Sidebar = ({ onLogin }) => {
  const dispatch = useDispatch()

  const [collapsed, setCollapsed] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [imageError, setImageError] = useState(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [openConversationMenu, setOpenConversationMenu] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showBilling, setShowBilling] = useState(false)
  const renamingRef = useRef(null)
  const conversations = useSelector((state) => state.conversation.conversationList) || []
  const selectedConversation = useSelector((state) => state.conversation.selectedConversation)
  const selectedConversationRef = useRef(selectedConversation)
  const isNewChatDraft = useRef(false)
  const userData = useSelector((state) => state.user.userData)
  const isAuthLoading = useSelector((state) => state.user.isLoading)
  const userID = userData?.userID || userData?._id || userData?.id
  const menuConversation = conversations.find((c) => c?._id === openConversationMenu)

  useEffect(() => {
    selectedConversationRef.current = selectedConversation
    if (selectedConversation) {
      isNewChatDraft.current = false
    }
  }, [selectedConversation])

  useEffect(() => {
    if (isAuthLoading) return

    if (!userID) {
      isNewChatDraft.current = false
      dispatch(setInitializingConversation(false))
      return
    }

    const getConversation = async () => {
      const data = await getConversations()

      if (Array.isArray(data)) {
        dispatch(setConversation(data))
        const activeConversation = data.find(
          (conversation) => conversation._id === selectedConversationRef.current?._id
        )
        const conversationToSelect = activeConversation || (!isNewChatDraft.current && data[0])

        if (conversationToSelect) {
          selectedConversationRef.current = conversationToSelect
          dispatch(setselectedConversation(conversationToSelect))
        } else {
          dispatch(setInitializingConversation(false))
        }
      } else {
        dispatch(setInitializingConversation(false))
      }
    }

    getConversation()
  }, [dispatch, isAuthLoading, userID])

  // Close account menu / conversation menu when clicking outside
  useEffect(() => {
    const closeMenus = (event) => {
      if (!event.target.closest('[data-account-trigger], [data-account-menu]')) {
        setAccountMenuOpen(false)
      }
      if (!event.target.closest('[data-convo-trigger], [data-convo-menu]')) {
        setOpenConversationMenu(null)
      }
    }

    document.addEventListener('mousedown', closeMenus)
    return () => document.removeEventListener('mousedown', closeMenus)
  }, [])

  // Escape closes menus and dialogs
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      setOpenConversationMenu(null)
      setAccountMenuOpen(false)
      setDeleteTarget(null)
      setLogoutConfirmOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Close the menu if the list scrolls or window resizes (fixed position would drift)
  useEffect(() => {
    if (!openConversationMenu) return
    const close = () => setOpenConversationMenu(null)
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [openConversationMenu])

  const handleCreateConversation = async () => {
    isNewChatDraft.current = true
    selectedConversationRef.current = null
    dispatch(setselectedConversation(null))
    dispatch(clearInputText())
    dispatch(setMessages([]))
    dispatch(setInitializingConversation(false))
    setMobileOpen(false)
  }

  const handleSelectConversation = (conversation) => {
    isNewChatDraft.current = false
    selectedConversationRef.current = conversation
    dispatch(setselectedConversation(conversation))
    dispatch(setMessages([]))
    dispatch(setInitializingConversation(true))
    setMobileOpen(false)
  }

  const openMenuFor = (event, conv) => {
    event.stopPropagation()
    if (openConversationMenu === conv._id) {
      setOpenConversationMenu(null)
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 144
    setMenuPos({
      top: rect.bottom + 4,
      left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
    })
    setOpenConversationMenu(conv._id)
  }

  // Rename: now inline in the sidebar row (no popup window)
  const startRename = (conversation) => {
    setRenameValue(conversation?.title || 'New Chat')
    renamingRef.current = conversation._id
    setRenamingId(conversation._id)
    setOpenConversationMenu(null)
  }

  const cancelRename = () => {
    renamingRef.current = null
    setRenamingId(null)
  }

  const handleRenameConversation = async (conversation) => {
    if (renamingRef.current !== conversation._id) return
    const title = renameValue.trim()
    cancelRename()
    if (!title || title === conversation?.title) return

    const updated = await updateConversation(conversation._id, title)
    if (!updated?._id) return

    const updatedConversations = conversations.map((item) =>
      item._id === updated._id ? updated : item
    )
    dispatch(setConversation(updatedConversations))
    if (selectedConversation?._id === updated._id) {
      dispatch(setselectedConversation(updated))
    }
  }

  // Delete: confirmation is now an in-app dialog (no window.confirm)
  const handleDeleteConversation = async (conversation) => {
    setDeleteTarget(null)

    const deleted = await deleteConversation(conversation._id)
    if (!deleted) return

    const remaining = conversations.filter((item) => item._id !== conversation._id)
    dispatch(setConversation(remaining))
    if (selectedConversation?._id === conversation._id) {
      selectedConversationRef.current = null
      dispatch(setselectedConversation(null))
      dispatch(setMessages([]))
      dispatch(clearInputText())
      dispatch(setInitializingConversation(false))
    }
    setOpenConversationMenu(null)
  }

  const confirmLogout = () => {
    setAccountMenuOpen(false)
    setLogoutConfirmOpen(true)
  }

  const handleLogout = async () => {
    try {
      await getLogOut()
      await signOut(auth)
      isNewChatDraft.current = false
      selectedConversationRef.current = null
      dispatch(setUserData(null))
      dispatch(setMessages([]))
      dispatch(setConversation([]))
      dispatch(setselectedConversation(null))
    } finally {
      // always close the dialog, even if logout fails, so the screen never gets stuck
      setLogoutConfirmOpen(false)
      setMobileOpen(false)
    }
  }

  return (
    <>
      {/* Top bar for mobile view */}
      <div className='fixed inset-x-0 top-0 z-40 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-[#0d0f14]/95 px-4 backdrop-blur-lg lg:hidden'>
        <button
          type='button'
          aria-label='Open sidebar'
          title='Open sidebar'
          onClick={() => setMobileOpen(true)}
          className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-transparent text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-100'
        >
          <Menu size={20} />
        </button>
        <span className='min-w-0 flex-1 truncate text-[16.8px] font-semibold text-slate-100'>CortexAI</span>
        <button
          type='button'
          aria-label='New chat'
          title='New chat'
          onClick={handleCreateConversation}
          className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-transparent text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-100'
        >
          <Plus size={20} />
        </button>
        <button
          type='button'
          aria-label='Open account options'
          title='Account options'
          onClick={() => {
            setMobileOpen(true)
            setAccountMenuOpen(true)
          }}
          className='h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/[0.06]'
          data-account-trigger='true'
        >
          {userData?.avatar && imageError !== userData.avatar ? (
            <img
              className='h-full w-full object-cover'
              src={userData.avatar}
              alt='Profile'
              onLoad={() => setImageError(null)}
              onError={() => setImageError(userData.avatar)}
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center'>
              <User size={17} className='text-slate-400' />
            </div>
          )}
        </button>
      </div>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className='fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden'
          />
        )}
      </AnimatePresence>

      {/* Main Animated Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? 64 : 270,
        }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className={`${mobileOpen ? 'flex' : 'hidden'} lg:flex fixed lg:static inset-y-0 left-0 z-50
        max-w-[85vw] flex-col min-h-0 h-full shrink-0 overflow-hidden
        bg-[#0d0f14] border-r border-white/[0.06]`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!collapsed ? (
            /* Expanded View */
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full w-[270px] max-w-[85vw] shrink-0"
            >
              {/* Header */}
              <div className='flex shrink-0 items-center gap-2.5 px-4 py-4 border-b border-white/[0.06]'>
                <div
                  onClick={() => setMobileOpen(false)}
                  className='flex items-center justify-center lg:hidden w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors cursor-pointer'
                >
                  <PanelLeftIcon size={18} />
                </div>

                <div
                  onClick={() => setCollapsed(true)}
                  className='hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors cursor-pointer'
                >
                  <PanelLeftIcon size={18} />
                </div>

                <span className='text-[16.8px] font-semibold text-slate-100 tracking-tight flex-1'>
                  CortexAI
                </span>

                <span className='text-[10.5px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full tracking-wide'>
                  free
                </span>
              </div>

              {/* Action Button */}
              <button
                onClick={handleCreateConversation}
                type='button'
                className='mx-3 mt-3 flex h-9 shrink-0 items-center justify-start gap-2 rounded-lg px-3 text-slate-300 hover:bg-white/[0.05] hover:text-slate-100 transition-colors cursor-pointer'
              >
                <PenSquare size={19} />
                <span className='text-[15.75px] font-medium'>New chat</span>
              </button>

              {/* Label */}
              <div className='shrink-0 px-5 pt-4 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-600'>
                {conversations.length === 0 ? "No Recent Conversations" : "Recents"}
              </div>

              {/* Conversation List */}
              <div className='min-h-0 flex-1 overflow-y-auto px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                onScroll={() => openConversationMenu && setOpenConversationMenu(null)}
              >
                {conversations.map((conv, i) => {
                  const isActive = selectedConversation?._id === conv?._id
                  const isRenaming = renamingId === conv?._id
                  const isMenuOpen = openConversationMenu === conv?._id
                  return (
                    <div
                      key={conv?._id || i}
                      onClick={() => !isRenaming && handleSelectConversation(conv)}
                      className={`group relative flex items-center gap-2.5 cursor-pointer mb-0.5 px-3 py-2 min-h-[44px] rounded-[10px] border transition-colors duration-150
                      ${isRenaming
                          ? "bg-white/[0.06] border-indigo-500/40"
                          : isActive
                            ? "bg-indigo-500/10 border-indigo-500/[0.18]"
                            : "bg-transparent border-transparent hover:bg-white/[0.04]"}`}
                    >
                      <div className={`flex items-center justify-center shrink-0 w-[28px] h-[28px] rounded-lg transition-colors
                      ${isActive ? "bg-indigo-500/15 text-indigo-400" : "bg-white/[0.05] text-slate-500"}`}>
                        <MessageSquare size={13} />
                      </div>

                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          maxLength={80}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onFocus={(e) => e.target.select()}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleRenameConversation(conv)
                            } else if (e.key === 'Escape') {
                              e.stopPropagation()
                              cancelRename()
                            }
                          }}
                          onBlur={() => handleRenameConversation(conv)}
                          aria-label='Conversation name'
                          className='min-w-0 flex-1 bg-transparent text-[13.65px] font-medium text-slate-100 outline-none placeholder:text-slate-600'
                          placeholder='Conversation name'
                        />
                      ) : (
                        <span className={`text-[13.65px] font-medium truncate ${isActive ? "text-slate-100" : "text-slate-300"}`}>
                          {conv?.title || "New Chat"}
                        </span>
                      )}

                      {!isRenaming && (
                        <button
                          type='button'
                          data-convo-trigger='true'
                          aria-label='Conversation options'
                          aria-haspopup='menu'
                          aria-expanded={isMenuOpen}
                          onClick={(event) => openMenuFor(event, conv)}
                          className={`ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition-opacity hover:bg-white/[0.08] hover:text-slate-200 focus:opacity-100
                          ${isMenuOpen ? 'opacity-100 bg-white/[0.08] text-slate-200' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'}`}
                        >
                          <MoreHorizontal size={17} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* User / Account Footer */}
              <div className='shrink-0 border-t border-white/[0.06]'>
                <div className='relative px-3.5 py-3.5'>
                  {userData ? (
                    <div className='flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 hover:bg-white/[0.05] transition-colors'>
                      <button
                        type='button'
                        onClick={() => setAccountMenuOpen(prev => !prev)}
                        className='relative shrink-0 rounded-full'
                        data-account-trigger='true'
                      >
                        {userData?.avatar && imageError !== userData.avatar ? (
                          <img
                            className='w-11 h-11 rounded-full object-cover border-2 border-indigo-500/25'
                            src={userData?.avatar}
                            alt={"image"}
                            onLoad={() => setImageError(null)}
                            onError={() => setImageError(userData.avatar)}
                          />
                        ) : (
                          <div className='w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center'>
                            <User size={18} className="text-slate-400" />
                          </div>
                        )}
                      </button>

                      <div className='flex-1 min-w-0'>
                        <p className='text-[14.2px] font-semibold text-slate-100 truncate'>{userData?.name || "user"}</p>
                        <p className='text-[11.55px] text-slate-600 mt-px'>{userData?.plan || "free plan"}</p>
                      </div>
                      <button className='flex items-center justify-center w-9 h-9 rounded-[7px] bg-transparent text-yellow-600 hover:bg-white/[0.08] hover:text-slate-400 transition-colors'
                        onClick={() => setShowBilling(true)}>
                        <Coins size={18} />
                      </button>
                    </div>
                  ) : !isAuthLoading ? (
                    <button
                      onClick={onLogin}
                      className='w-full flex items-center justify-center gap-2 text-[15.75px] font-medium text-slate-200 bg-white/[0.05] border border-white/[0.08] rounded-xl py-3 hover:bg-white/[0.08] transition-colors'
                    >
                      Login
                    </button>
                  ) : null}

                  <AnimatePresence>
                    {userData && accountMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        data-account-menu='true'
                        className='absolute bottom-full left-3.5 z-50 mb-2 w-[190px] rounded-xl border border-white/[0.08] bg-[#171a22] p-1.5 shadow-xl shadow-black/30'
                      >
                        <button
                          type='button'
                          onClick={confirmLogout}
                          className='flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[14.7px] text-slate-200 hover:bg-white/[0.06] hover:text-white transition-colors'
                        >
                          <LogOut size={17} />
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Collapsed View */
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center h-full w-16 py-4 gap-1 shrink-0"
            >
              <button
                className='flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors cursor-pointer mb-1'
                onClick={() => setCollapsed(false)}
              >
                <PanelRight />
              </button>

              <button
                type='button'
                className='flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.05] transition-colors cursor-pointer'
                onClick={handleCreateConversation}
              >
                <Plus size={17} />
              </button>

              <div className='flex-1 overflow-y-auto px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-5'>
                {conversations.map((conv, i) => {
                  const isActive = selectedConversation?._id === conv?._id
                  return (
                    <div
                      key={conv?._id || i}
                      onClick={() => handleSelectConversation(conv)}
                      title={conv?.title || "New Chat"}
                      className={`relative flex items-center justify-center cursor-pointer mb-1.5 p-2 rounded-[10px] border transition-colors
                      ${isActive ? "bg-indigo-500/10 border-indigo-500/[0.18]" : "bg-transparent border-transparent"}`}
                    >
                      <div className={`flex items-center justify-center w-[20px] h-[20px] rounded-lg
                      ${isActive ? "text-indigo-400" : "text-slate-500"}`}>
                        <MessageSquare size={13} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className='relative shrink-0'>
                <button
                  type='button'
                  onClick={() => {
                    setCollapsed(false)
                    setAccountMenuOpen(true)
                  }}
                  className='rounded-full'
                  data-account-trigger='true'
                >
                  {userData?.avatar && imageError !== userData.avatar ? (
                    <img
                      className='w-10 h-10 rounded-full object-cover border-2 border-indigo-500/25'
                      src={userData?.avatar}
                      alt={"image"}
                      onLoad={() => setImageError(null)}
                      onError={() => setImageError(userData.avatar)}
                    />
                  ) : (
                    <div className='w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center'>
                      <User size={18} className="text-slate-400" />
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      {/* Conversation options menu (fixed, so the list never clips it) */}
      <AnimatePresence>
        {menuConversation && (
          <motion.div
            key='convo-menu'
            data-convo-menu='true'
            role='menu'
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            style={{ top: menuPos.top, left: menuPos.left }}
            className='fixed z-[70] w-36 rounded-xl border border-white/[0.08] bg-[#171a22] p-1 shadow-xl shadow-black/40'
          >
            <button
              type='button'
              role='menuitem'
              onClick={() => startRename(menuConversation)}
              className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-[13.65px] text-slate-200 transition-colors hover:bg-white/[0.06]'
            >
              <Pencil size={14} className='text-slate-400' />
              Rename
            </button>
            <button
              type='button'
              role='menuitem'
              onClick={() => {
                setDeleteTarget(menuConversation)
                setOpenConversationMenu(null)
              }}
              className='flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-[13.65px] text-red-300 transition-colors hover:bg-red-500/10'
            >
              <Trash2 size={14} />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className='fixed inset-0 bg-black/70 backdrop-blur-sm'
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              role='alertdialog'
              aria-modal='true'
              aria-labelledby='delete-title'
              className='relative z-10 w-full max-w-[360px] rounded-2xl border border-white/[0.1] bg-[#171a22] p-6 shadow-2xl shadow-black/50'
            >
              <div className='flex flex-col items-center text-center'>
                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400'>
                  <Trash2 size={22} />
                </div>
                <h2 id='delete-title' className='text-lg font-semibold text-white'>
                  Delete this chat?
                </h2>
                <p className='mt-2 max-w-full truncate text-sm text-slate-400'>
                  {deleteTarget?.title || 'New Chat'}
                </p>
                <p className='mt-1 text-xs text-slate-500'>This can't be undone.</p>
              </div>
              <div className='mt-6 flex gap-3'>
                <button
                  type='button'
                  autoFocus
                  onClick={() => setDeleteTarget(null)}
                  className='flex-1 rounded-xl border border-white/[0.1] bg-transparent px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white'
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={() => handleDeleteConversation(deleteTarget)}
                  className='flex-1 rounded-xl bg-red-500/90 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-500'
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Modal */}
      <AnimatePresence>
        {logoutConfirmOpen && userData && (
          <div className='fixed inset-0 z-[100] flex items-center justify-center p-4'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLogoutConfirmOpen(false)}
              className='fixed inset-0 bg-black/70 backdrop-blur-sm'
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              role='dialog'
              aria-modal='true'
              aria-labelledby='logout-title'
              className='relative z-10 w-full max-w-[360px] rounded-2xl border border-white/[0.1] bg-[#171a22] p-6 shadow-2xl shadow-black/50'
            >
              <div className='flex flex-col items-center text-center'>
                <div className='mb-4 h-16 w-16 overflow-hidden rounded-full bg-white/[0.06]'>
                  {userData.avatar && imageError !== userData.avatar ? (
                    <img
                      className='h-full w-full object-cover'
                      src={userData.avatar}
                      alt='Profile'
                      onError={() => setImageError(userData.avatar)}
                    />
                  ) : (
                    <div className='flex h-full w-full items-center justify-center'>
                      <User size={26} className='text-slate-400' />
                    </div>
                  )}
                </div>
                <h2 id='logout-title' className='text-lg font-semibold text-white'>
                  Are you sure you want to logout?
                </h2>
                <p className='mt-2 max-w-full truncate text-sm text-slate-400'>
                  {userData.name || 'User'}
                </p>
                <p className='max-w-full truncate text-sm text-slate-500'>
                  {userData.email || ''}
                </p>
              </div>
              <div className='mt-6 flex gap-3'>
                <button
                  type='button'
                  autoFocus
                  onClick={() => setLogoutConfirmOpen(false)}
                  className='flex-1 rounded-xl border border-white/[0.1] bg-transparent px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white'
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={handleLogout}
                  className='flex-1 rounded-xl bg-red-500/90 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-500'
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Billing
        open={showBilling}
        onClose={() => setShowBilling(false)}
        onPaymentSuccess={async () => {
          const updatedUser = await getCurrentUser()
          if (updatedUser) dispatch(setUserData(updatedUser))
        }}
      />
    </>
  )
}

export default Sidebar
