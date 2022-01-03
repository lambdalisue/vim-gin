function! gin#internal#feature#reload#core#init() abort
  call s:define_commands()
  call s:define_mappings()
  call s:define_default_mappings()
endfunction

function! s:define_commands() abort
  execute printf('command! -buffer -bar GinReload call denops#request("gin", "reload:command", [%d])', bufnr('%'))
endfunction

function! s:define_mappings() abort
  nnoremap <buffer> <Plug>(gin-reload) <Cmd>GinReload<CR><C-l>
endfunction

function! s:define_default_mappings() abort
  if !hasmapto('<Plug>(gin-reload)')
    nmap <buffer><nowait> <C-l> <Plug>(gin-reload)
  endif
endfunction
