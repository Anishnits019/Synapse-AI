import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, PanelLeftIcon, PanelRight, PenSquare, Plus, MessageSquare, User, LogOut, Coins, MoreHorizontal } from 'lucide-react'

import { createConversation } from '../features/createConversation'
import { getConversations } from '../features/getConversations'
import { getLogOut } from '../features/logout'
import { updateConversation } from '../features/updateConversation'
import { deleteConversation } from '../features/deleteConversation'
import { useDispatch, useSelector } from 'react-redux'
import {
  setConversation,
  addConversation,
  setselectedConversation
} from '../redux/conversationSlice'

import { setUserData } from '../redux/userSlice'
import { setMessages } from '../redux/messageSlice'
import { getCurrentUser } from '../features/getCurrentUser'
import Billing from './Billing'

export const Sidebar = ({ onLogin }) => {
  const dispatch = useDispatch()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [imageError, setImageError] = useState(null)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [openConversationMenu, setOpenConversationMenu] = useState(null)
  const [showBilling,setShowBilling] =useState(false)
  const conversations = useSelector((state) => state.conversation.conversationList) || []
  const selectedConversation = useSelector((state) => state.conversation.selectedConversation)
  const userData = useSelector((state) => state.user.userData)
  const userID = userData?.userID || userData?._id || userData?.id

  useEffect(() => {
    if (!userID) return

    const getConversation = async () => {
      const data = await getConversations()
      
      if (Array.isArray(data)) {
        dispatch(setConversation(data))

        if (!selectedConversation && data.length > 0) {
          dispatch(setselectedConversation(data[0]))
        }
      }
    }

    getConversation()
  }, [dispatch, selectedConversation, userID])

  useEffect(() => {
    const closeAccountMenu = (event) => {
      if (!event.target.closest('[data-account-trigger], [data-account-menu]')) {
        setAccountMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', closeAccountMenu)
    return () => document.removeEventListener('mousedown', closeAccountMenu)
  }, [])

  const handleCreateConversation = async () => {
    const data = await createConversation()
    if (!data?._id) return
    dispatch(addConversation(data))
    dispatch(setselectedConversation(data))
  }

  const handleRenameConversation = async (conversation) => {
    const title = window.prompt("Conversation name", conversation?.title || "New Chat")
    if (!title?.trim()) return

    const updated = await updateConversation(conversation._id, title.trim())
    if (!updated?._id) return

    const updatedConversations = conversations.map((item) =>
      item._id === updated._id ? updated : item
    )
    dispatch(setConversation(updatedConversations))
    if (selectedConversation?._id === updated._id) {
      dispatch(setselectedConversation(updated))
    }
    setOpenConversationMenu(null)
  }

  const handleDeleteConversation = async (conversation) => {
    if (!window.confirm("Delete this conversation?")) return

    const deleted = await deleteConversation(conversation._id)
    if (!deleted) return

    const remaining = conversations.filter((item) => item._id !== conversation._id)
    dispatch(setConversation(remaining))
    if (selectedConversation?._id === conversation._id) {
      dispatch(setselectedConversation(remaining[0] || null))
    }
    setOpenConversationMenu(null)
  }

  const confirmLogout = () => {
    setAccountMenuOpen(false)
    setLogoutConfirmOpen(true)
  }

  const handleLogout = async () => {
    await getLogOut()
    dispatch(setUserData(null))
    dispatch(setMessages([]))
    dispatch(setConversation([]))
    dispatch(setselectedConversation(null))
    setLogoutConfirmOpen(false)
    setMobileOpen(false)
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
        <span className='min-w-0 flex-1 truncate text-[16px] font-semibold text-slate-100'>CortexAI</span>
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
        flex-col min-h-0 h-full shrink-0 overflow-hidden
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
              className="flex flex-col h-full w-[270px] shrink-0"
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

                <span className='text-[16px] font-semibold text-slate-100 tracking-tight flex-1'>
                  CortexAI
                </span>

                <span className='text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full tracking-wide'>
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
                <span className='text-[15px] font-medium'>New chat</span>
              </button>

              {/* Label */}
              <div className='shrink-0 px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-600'>
                {conversations.length === 0 ? "No Recent Conversations" : "Recents"}
              </div>

              {/* Conversation List */}
              <div className='min-h-0 flex-1 overflow-y-auto px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
                {conversations.map((conv, i) => {
                  const isActive = selectedConversation?._id === conv?._id
                  return (
                    <div
                      key={conv?._id || i}
                      onClick={() => dispatch(setselectedConversation(conv))}
                      className={`relative flex items-center gap-2.5 cursor-pointer mb-0.5 px-3 py-2.5 rounded-[10px] border transition-colors duration-150
                      ${isActive ? "bg-indigo-500/10 border-indigo-500/[0.18]" : "bg-transparent border-transparent"}`}
                    >
                      <div className={`flex items-center justify-center shrink-0 w-[28px] h-[28px] rounded-lg transition-colors
                      ${isActive ? "bg-indigo-500/15 text-indigo-400" : "bg-white/[0.05] text-slate-500"}`}>
                        <MessageSquare size={13} />
                      </div>
                      <span className={`text-[13px] font-medium truncate ${isActive ? "text-slate-100" : "text-slate-300"}`}>
                        {conv?.title || "New Chat"}
                      </span>
                      <button
                        type='button'
                        onClick={(event) => {
                          event.stopPropagation()
                          setOpenConversationMenu(openConversationMenu === conv._id ? null : conv._id)
                        }}
                        className='ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-white/[0.08] hover:text-slate-200'
                      >
                        <MoreHorizontal size={17} />
                      </button>

                      <AnimatePresence>
                        {openConversationMenu === conv._id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            className='absolute right-2 top-10 z-20 w-28 rounded-lg border border-white/[0.08] bg-[#171a22] p-1 shadow-xl'
                          >
                            <button type='button' onClick={(event) => { event.stopPropagation(); handleRenameConversation(conv) }} className='w-full rounded-md px-2.5 py-2 text-left text-xs text-slate-300 hover:bg-white/[0.06]'>Rename</button>
                            <button type='button' onClick={(event) => { event.stopPropagation(); handleDeleteConversation(conv) }} className='w-full rounded-md px-2.5 py-2 text-left text-xs text-red-300 hover:bg-white/[0.06]'>Delete</button>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
                        className='relative shrink-0 rounded-xl'
                        data-account-trigger='true'
                      >
                        {userData?.avatar && imageError !== userData.avatar ? (
                          <img
                            className='w-11 h-11 rounded-xl object-cover border-2 border-indigo-500/25'
                            src={userData?.avatar}
                            alt={"image"}
                            onLoad={() => setImageError(null)}
                            onError={() => setImageError(userData.avatar)}
                          />
                        ) : (
                          <div className='w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center'>
                            <User size={18} className="text-slate-400" />
                          </div>
                        )}
                      </button>

                      <div className='flex-1 min-w-0'>
                        <p className='text-[13.5px] font-semibold text-slate-100 truncate'>{userData?.name || "user"}</p>
                        <p className='text-[11px] text-slate-600 mt-px'>{userData?.plan || "free plan"}</p>
                      </div>
                      <button className='flex items-center justify-center w-9 h-9 rounded-[7px] bg-transparent text-yellow-600 hover:bg-white/[0.08] hover:text-slate-400 transition-colors'
                      onClick={()=>setShowBilling(true)}>
                        <Coins size={18} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={onLogin}
                      className='w-full flex items-center justify-center gap-2 text-[15px] font-medium text-slate-200 bg-white/[0.05] border border-white/[0.08] rounded-xl py-3 hover:bg-white/[0.08] transition-colors'
                    >
                      Login
                    </button>
                  )}

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
                          className='flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[14px] text-slate-200 hover:bg-white/[0.06] hover:text-white transition-colors'
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
                      onClick={() => dispatch(setselectedConversation(conv))}
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
                  className='rounded-xl'
                  data-account-trigger='true'
                >
                  {userData?.avatar && imageError !== userData.avatar ? (
                    <img
                      className='w-10 h-10 rounded-xl object-cover border-2 border-indigo-500/25'
                      src={userData?.avatar}
                      alt={"image"}
                      onLoad={() => setImageError(null)}
                      onError={() => setImageError(userData.avatar)}
                    />
                  ) : (
                    <div className='w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center'>
                      <User size={18} className="text-slate-400" />
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

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
              className='relative z-10 w-full max-w-[360px] rounded-2xl border border-white/[0.1] bg-[#171a22] p-6 shadow-2xl shadow-black/50'
            >
              <div className='flex flex-col items-center text-center'>
                <div className='mb-4 h-16 w-16 overflow-hidden rounded-2xl bg-white/[0.06]'>
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
                <p className='mt-2 text-sm text-slate-400'>
                  {userData.name || 'User'}
                </p>
                <p className='text-sm text-slate-500'>
                  {userData.email || ''}
                </p>
              </div>
              <div className='mt-6 flex gap-3'>
                <button
                  type='button'
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
      onClose={()=>setShowBilling(false)}
      onPaymentSuccess={async () => {
        const updatedUser = await getCurrentUser()
        if (updatedUser) dispatch(setUserData(updatedUser))
      }}
      />
    </>
  )
}

export default Sidebar