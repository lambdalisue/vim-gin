function! gin#component#worktree#full(...) abort
  try
    let cwd = a:0 ? a:1 : ''
    return denops#request('gin', 'component:worktree:full', [cwd])
  catch
    return ""
  endtry
endfunction

function! gin#component#worktree#name(...) abort
  try
    let cwd = a:0 ? a:1 : ''
    return denops#request('gin', 'component:worktree:name', [cwd])
  catch
    return ""
  endtry
endfunction
