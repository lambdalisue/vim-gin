if get(g:, 'gin_proxy_disable_accept_and_cancel_aliases', 0)
  finish
endif

if !exists(':Accept')
  command! Accept wq
endif
if !exists(':Cancel')
  command! Cancel cq
endif
