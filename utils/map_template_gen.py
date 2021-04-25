#!/usr/bin/env python
# coding: utf-8

# In[1]:


import os


# In[65]:


inside = [f for f in os.listdir('assets') if f.startswith('inside')]


# In[67]:


inside.sort()


# In[15]:


TEMPLATE = """{
        position: [0, 0, 0],
        rotation: [0, 0, 0]
    },"""


# In[71]:


print("SELENGA_MAP = {")
for i in inside:
    print("'assets/" + i + "': " + TEMPLATE)
print("};")

