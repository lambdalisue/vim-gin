let s:redraw_component_timer = 0

function! gin#util#reload(...) abort
  let bufnr = a:0 ? a:1 : bufnr()
  call denops#plugin#wait('gin')
  call denops#request('gin', 'util:reload', [bufnr])
endfunction

function! gin#util#expand(expr) abort
  call denops#plugin#wait('gin')
  return denops#request('gin', 'util:expand', [a:expr])
endfunction

function! gin#util#redraw_components() abort
  silent! call timer_stop(s:redraw_component_timer)
  let s:redraw_component_timer = timer_start(
        \ g:gin#util#redraw_components_delay,
        \ { -> execute('redrawstatus | redrawtabline') },
        \)
endfunction

let g:gin#util#redraw_components_delay = get(g:, 'gin#util#redraw_components_delay', 100)
