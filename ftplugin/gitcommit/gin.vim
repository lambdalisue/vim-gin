if get(g:, 'gin_proxy_disable_accept_and_cancel_aliases', 0)
  finish
endif

if !exists(':Accept')
  command! -buffer Accept wq
endif
if !exists(':Cancel')
  command! -buffer Cancel cq
endif
