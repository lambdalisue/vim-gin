let s:name = ''
let s:full = ''

function! gin#component#worktree#full(...) abort
  let cwd = a:0 ? a:1 : ''
  call timer_start(0, { -> s:update_full(cwd) })
  return s:full
endfunction

function! gin#component#worktree#name(...) abort
  let cwd = a:0 ? a:1 : ''
  call timer_start(0, { -> s:update_name(cwd) })
  return s:name
endfunction

function! s:update_name(cwd) abort
  try
    let s:name = denops#request('gin', 'component:worktree:name', [a:cwd])
  catch
    let s:name = ''
  endtry
  call gin#util#redraw_components()
endfunction

function! s:update_full(cwd) abort
  try
    let s:full = denops#request('gin', 'component:worktree:full', [a:cwd])
  catch
    let s:full = ''
  endtry
  call gin#util#redraw_components()
endfunction
