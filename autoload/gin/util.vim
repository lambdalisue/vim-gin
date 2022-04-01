let s:debounce_timers = {}

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

function! gin#util#debounce(expr, ...) abort
  let options = extend({
        \ 'delay': g:gin#util#debounce_delay,
        \}, a:0 ? a:1 : {},
        \)
  let timer = get(s:debounce_timers, a:expr, 0)
  silent! call timer_stop(timer)
  let s:debounce_timers[a:expr] = timer_start(
        \ options.delay,
        \ { -> execute(a:expr) },
        \)
endfunction

let g:gin#util#debounce_delay = get(g:, 'gin#util#debounce_delay', 100)
