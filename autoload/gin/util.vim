let s:debounce_timers = {}

function! gin#util#reload(...) abort
  let bufnr = a:0 ? a:1 : bufnr()
  call denops#plugin#wait_async('gin', { -> denops#notify('gin','util:reload', [bufnr]) })
endfunction

function! gin#util#expand(expr) abort
  call denops#plugin#wait('gin')
  return denops#request('gin', 'util:expand', [a:expr])
endfunction

function! gin#util#worktree(...) abort
  call denops#plugin#wait('gin')
  if a:0
    return denops#request('gin', 'util:worktree', [a:1])
  else
    return denops#request('gin', 'util:worktree', [])
  endif
endfunction
