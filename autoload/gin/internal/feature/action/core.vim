function! gin#internal#feature#action#core#init() abort
  call gin#internal#feature#action#action#register()
  call s:define_default_mappings()
endfunction

function! s:define_default_mappings() abort
  if !hasmapto('<Plug>(gin-action-choice)')
    map <buffer><nowait> a <Plug>(gin-action-choice)
  endif

  if !hasmapto('<Plug>(gin-action-repeat)')
    map <buffer><nowait> . <Plug>(gin-action-repeat)
  endif

  if !hasmapto('<Plug>(gin-action-help)', 'n')
    nmap <buffer><nowait> ? <Plug>(gin-action-help)
  endif
endfunction
