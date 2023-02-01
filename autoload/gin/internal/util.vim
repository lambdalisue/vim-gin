let s:debounce_timers = {}

function! gin#internal#util#debounce(expr, delay) abort
  let timer = get(s:debounce_timers, a:expr, 0)
  silent! call timer_stop(timer)
  let s:debounce_timers[a:expr] = timer_start(a:delay, { -> execute(a:expr) })
endfunction
